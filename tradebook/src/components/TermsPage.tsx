import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-white">
            MyTradeBook
          </Link>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold font-display text-white mb-8">Terms of Service</h1>

        <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
          <p>Last updated: March 2026</p>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using MyTradeBook, you agree to be bound by these Terms of Service. If
              you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Description of Service</h2>
            <p>
              MyTradeBook is a personal trade journaling tool. It allows you to log, review, and
              analyze your trades. MyTradeBook is not a broker, financial advisor, or trading platform.
              We do not execute trades, provide financial advice, or make investment recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Not Financial Advice</h2>
            <p>
              Nothing on MyTradeBook constitutes financial, investment, or trading advice. All trade
              data, analytics, and metrics are for personal journaling purposes only. You are solely
              responsible for your trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account credentials. You agree
              not to misuse the service, attempt to access other users' data, or use the platform for
              any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Limitation of Liability</h2>
            <p>
              MyTradeBook is provided "as is" without warranties of any kind. We are not liable for any
              losses, damages, or missed opportunities arising from your use of the service or
              reliance on any data displayed within it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of MyTradeBook after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Contact</h2>
            <p>
              Questions about these terms? Reach out on{" "}
              <a
                href="https://instagram.com/ohjudo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-400 hover:underline"
              >
                Instagram @ohjudo
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
