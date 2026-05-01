import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-surface-0 text-primary">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="text-[13px] font-medium text-primary">
            MyTradeBook
          </Link>
          <Link to="/" className="text-xs text-tertiary hover:text-secondary transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-base font-medium text-primary mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-tertiary mb-8">Last updated: March 24, 2026</p>

        <div className="space-y-6 text-[13px] text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-primary mb-2">1. Introduction</h2>
            <p>
              Ohjudo ("Company," "we," "us," or "our") operates the MyTradeBook application and
              related services available at mytradebook.app (the "Service"). This Privacy Policy
              explains how we collect, use, disclose, and protect your personal information when you
              use our Service. By using MyTradeBook, you consent to the data practices described in
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">2. Information We Collect</h2>
            <p className="mb-3">We collect the following categories of information:</p>

            <h3 className="text-[13px] font-medium text-secondary mb-1">Account Information</h3>
            <p className="mb-3">
              When you create an account, we collect your email address and display name. This
              information is required to authenticate you and provide the Service.
            </p>

            <h3 className="text-[13px] font-medium text-secondary mb-1">Payment Information</h3>
            <p className="mb-3">
              Subscription payments are processed by Stripe, our third-party payment processor. When
              you subscribe, your payment details (credit card number, billing address, etc.) are
              collected and processed directly by Stripe. We do not store your full credit card number
              or payment credentials on our servers. We receive only a limited set of information from
              Stripe, such as the last four digits of your card, card brand, and billing status, to
              display in your account settings and manage your subscription.
            </p>

            <h3 className="text-[13px] font-medium text-secondary mb-1">Trading Journal Data</h3>
            <p className="mb-3">
              We store all trade data, journal entries, notes, tags, and other content you voluntarily
              enter into the Service. This includes ticker symbols, entry/exit prices, position sizes,
              dates, emotions, setups, and any notes or screenshots you upload.
            </p>

            <h3 className="text-[13px] font-medium text-secondary mb-1">Usage Data</h3>
            <p className="mb-3">
              We automatically collect information about how you interact with the Service, including
              pages visited, features used, and actions taken within the application.
            </p>

            <h3 className="text-[13px] font-medium text-secondary mb-1">Device & Technical Information</h3>
            <p>
              We collect your IP address, browser type, operating system, device type, and referring
              URLs. This information helps us operate, maintain, and improve the Service, as well as
              detect and prevent fraud or abuse.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your subscription and manage billing</li>
              <li>Display your trade data, analytics, and journal entries back to you</li>
              <li>Improve, personalize, and optimize the Service</li>
              <li>Communicate with you about your account, service updates, and support requests</li>
              <li>Detect, prevent, and address technical issues, fraud, or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">
              We do not use your trading data to build profiles for advertising, sell to data brokers,
              or for any purpose other than providing and improving the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">4. Data Sharing & Third Parties</h2>
            <p className="mb-2">
              We do not sell, rent, lease, or trade your personal information to third parties. We may
              share limited information with the following service providers who assist us in operating
              the Service:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong className="text-secondary">Stripe:</strong> Processes subscription payments.
                Stripe's use of your information is governed by{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand/80 transition-colors"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-secondary">Supabase:</strong> Provides database hosting,
                authentication, and backend infrastructure. Your data is stored with row-level
                security, ensuring only you can access your own data.
              </li>
            </ul>
            <p className="mt-2">
              We may also disclose your information if required by law, court order, or governmental
              regulation, or if we believe disclosure is necessary to protect our rights, your safety,
              or the safety of others.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">5. Data Security</h2>
            <p>
              We take the security of your data seriously. All data transmitted between your browser
              and our servers is encrypted using HTTPS (TLS/SSL). Your data is stored with
              industry-standard encryption at rest. We use Supabase's row-level security to ensure
              that only you can access your own trade data. While we implement commercially reasonable
              security measures, no method of electronic transmission or storage is 100% secure, and
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">6. Cookies & Tracking</h2>
            <p className="mb-2">We use cookies and similar technologies for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong className="text-secondary">Essential cookies:</strong> Required for
                authentication, session management, and core Service functionality. These cannot be
                disabled.
              </li>
              <li>
                <strong className="text-secondary">Analytics cookies:</strong> Help us understand how
                users interact with the Service so we can improve it. These collect anonymized usage
                data.
              </li>
            </ul>
            <p className="mt-2">
              We do not use cookies for advertising or cross-site tracking purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">7. Data Retention & Deletion</h2>
            <p>
              We retain your personal information and trade data for as long as your account is
              active or as needed to provide the Service. If you request deletion of your account, we
              will permanently delete all of your personal data and trade data from our systems within
              30 days of receiving your request, unless we are legally required to retain certain
              information. To request account deletion, contact us at{" "}
              <a
                href="mailto:countingthis@gmail.com"
                className="text-brand hover:text-brand/80 transition-colors"
              >
                countingthis@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">8. Your Rights</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Export your data in a portable format</li>
              <li>Object to or restrict certain processing of your data</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:countingthis@gmail.com"
                className="text-brand hover:text-brand/80 transition-colors"
              >
                countingthis@gmail.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">9. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly
              collect personal information from children under 18. If we learn that we have collected
              information from a child under 18, we will take steps to delete that information
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or applicable laws. If we make material changes, we will notify you by email or by
              posting a prominent notice within the Service at least 30 days before the changes take
              effect. Your continued use of the Service after the effective date of any changes
              constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">11. Governing Law</h2>
            <p>
              This Privacy Policy shall be governed by and construed in accordance with the laws of
              the Commonwealth of Massachusetts, without regard to its conflict of laws principles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">12. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices,
              please contact us at{" "}
              <a
                href="mailto:countingthis@gmail.com"
                className="text-brand hover:text-brand/80 transition-colors"
              >
                countingthis@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-tertiary">&copy; 2026 Ohjudo. All rights reserved.</span>
          <div className="flex items-center gap-6 text-xs text-tertiary">
            <Link to="/privacy" className="hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-secondary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
