import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Extract period dates — newer Stripe API versions moved these to the item level */
function getPeriodDates(sub: any): { start: string; end: string } {
  const item = sub.items?.data?.[0];
  const periodStart = sub.current_period_start ?? item?.current_period_start;
  const periodEnd = sub.current_period_end ?? item?.current_period_end;
  return {
    start: new Date(periodStart * 1000).toISOString(),
    end: new Date(periodEnd * 1000).toISOString(),
  };
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId || !customerId) break;

      // Fetch the full subscription to get period and price details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const userId =
        subscription.metadata?.supabase_user_id ??
        session.metadata?.supabase_user_id ??
        null;

      const period = getPeriodDates(subscription);
      await supabaseAdmin.from("subscriptions").upsert(
        {
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          user_id: userId,
          status: subscription.status,
          price_id: priceId,
          current_period_start: period.start,
          current_period_end: period.end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" }
      );

      // Also update the profile plan
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro", subscription_status: "active" })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[DEBUG] subscription.updated payload:", {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        metadata: subscription.metadata,
      });
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const userId = subscription.metadata?.supabase_user_id ?? null;

      const period = getPeriodDates(subscription);
      const upsertResult = await supabaseAdmin.from("subscriptions").upsert(
        {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          user_id: userId,
          status: subscription.status,
          price_id: priceId,
          current_period_start: period.start,
          current_period_end: period.end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" }
      );
      console.log("[DEBUG] subscription upsert result:", upsertResult);

      // Sync profile plan
      if (userId) {
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";
        const isPastDue = subscription.status === "past_due";
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: isActive || isPastDue ? "pro" : "free",
            subscription_status: isActive
              ? "active"
              : isPastDue
                ? "past_due"
                : "canceled",
          })
          .eq("id", userId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.supabase_user_id ?? null;

      // Mark subscription as past_due in our subscriptions table
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      // Update profile — keep plan as "pro" so they still have access
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id ?? null;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      // Downgrade profile
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", subscription_status: "canceled" })
          .eq("id", userId);
      }
      break;
    }
  }
  } catch (err) {
    console.error("[WEBHOOK ERROR]", event.type, err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
