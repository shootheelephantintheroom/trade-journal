import { Link } from "react-router-dom";

export default function TermsPage() {
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
        <h1 className="text-base font-medium text-primary mb-2">Terms of Service</h1>
        <p className="text-[13px] text-tertiary mb-8">Last updated: March 24, 2026</p>

        <div className="space-y-6 text-[13px] text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-primary mb-2">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and
              Ohjudo ("Company," "we," "us," or "our"), governing your access to and use of the
              MyTradeBook application and related services available at mytradebook.app (collectively,
              the "Service"). By creating an account or using the Service, you acknowledge that you
              have read, understood, and agree to be bound by these Terms. If you do not agree to
              these Terms, you must not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use the Service. By using MyTradeBook, you
              represent and warrant that you are at least 18 years old and have the legal capacity to
              enter into these Terms. If you are using the Service on behalf of an organization, you
              represent and warrant that you have the authority to bind that organization to these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">3. Description of Service</h2>
            <p>
              MyTradeBook is a software-as-a-service (SaaS) subscription platform that provides an
              intraday trading journal and analytics tool. The Service allows you to log, review,
              organize, and analyze your trades for personal record-keeping and self-improvement
              purposes. MyTradeBook is not a broker, financial advisor, registered investment advisor,
              or trading platform. We do not execute trades, hold funds, or have access to your
              brokerage accounts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">4. Not Financial Advice</h2>
            <p>
              Nothing on MyTradeBook — including any analytics, metrics, statistics, charts,
              performance summaries, or other data displayed within the Service — constitutes
              financial, investment, tax, or trading advice. All information is provided for personal
              journaling and informational purposes only. You are solely responsible for your own
              trading and investment decisions. We strongly recommend consulting a qualified financial
              advisor before making any investment decisions. Use of the Service does not create a
              fiduciary, advisory, or professional relationship between you and Ohjudo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">5. Subscription & Billing</h2>
            <p className="mb-2">
              MyTradeBook is offered as a paid subscription service billed on a monthly basis. By
              subscribing, you agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong className="text-secondary">Payment processing:</strong> All payments are
                processed securely through Stripe. By providing your payment information, you
                authorize Stripe to charge your selected payment method for the applicable
                subscription fees.
              </li>
              <li>
                <strong className="text-secondary">Auto-renewal:</strong> Your subscription will
                automatically renew at the end of each billing cycle at the then-current rate unless
                you cancel before the renewal date.
              </li>
              <li>
                <strong className="text-secondary">Cancellation:</strong> You may cancel your
                subscription at any time through your account settings. Upon cancellation, you will
                retain access to the Service through the end of your current billing period.
              </li>
              <li>
                <strong className="text-secondary">Non-refundable fees:</strong> All subscription fees
                are non-refundable. No refunds or credits will be issued for partial billing periods,
                unused time, or account downgrades.
              </li>
              <li>
                <strong className="text-secondary">Price changes:</strong> We reserve the right to
                change subscription pricing at any time. Any price changes will take effect at the
                start of your next billing cycle, and we will provide you with reasonable advance
                notice of any such changes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">6. Your Data & Ownership</h2>
            <p>
              You retain full ownership of all trade data, journal entries, notes, and other content
              you submit to the Service ("Your Data"). By using the Service, you grant Ohjudo a
              limited, non-exclusive license to store, process, and display Your Data solely for the
              purpose of providing and improving the Service. We will not sell, rent, lease, or
              otherwise distribute Your Data to third parties. You may export or request deletion of
              Your Data at any time, subject to Section 11 below.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">7. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to access another user's account or data</li>
              <li>Interfere with, disrupt, or compromise the integrity or security of the Service</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems (bots, scrapers, etc.) to access the Service without our prior written consent</li>
              <li>Resell, sublicense, or redistribute access to the Service</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate your account if we reasonably believe you
              are in violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">8. Intellectual Property</h2>
            <p>
              The Service, including its design, code, features, branding, and documentation, is the
              property of Ohjudo and is protected by applicable intellectual property laws. These
              Terms do not grant you any right, title, or interest in the Service beyond the limited
              right to use it in accordance with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF
              ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              OHJUDO DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR
              FREE OF HARMFUL COMPONENTS. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL OHJUDO, ITS
              OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR
              GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE
              SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL
              AGGREGATE LIABILITY ARISING OUT OF THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE
              AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO
              THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">11. Account Termination & Data Deletion</h2>
            <p>
              You may close your account at any time by contacting us. We may also suspend or
              terminate your account for violations of these Terms. Upon account termination, your
              right to use the Service will cease immediately. Your Data will be deleted within 30
              days of your account deletion request, except where we are required to retain it by
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Ohjudo and its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable attorneys' fees) arising out of or related to your use of
              the Service, your violation of these Terms, or your violation of any rights of a third
              party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              Commonwealth of Massachusetts, without regard to its conflict of laws principles. Any
              legal action or proceeding arising under these Terms shall be brought exclusively in the
              state or federal courts located in the Commonwealth of Massachusetts, and you hereby
              consent to the personal jurisdiction of such courts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">14. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make material changes, we
              will notify you by email or by posting a notice within the Service at least 30 days
              before the changes take effect. Your continued use of the Service after the effective
              date of any changes constitutes your acceptance of the updated Terms. If you do not
              agree to the updated Terms, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision
              shall be limited or eliminated to the minimum extent necessary so that these Terms shall
              otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-primary mb-2">16. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
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
