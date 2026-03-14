import { Link } from "react-router-dom";

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold font-display text-white mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
          <p>Last updated: March 2026</p>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>
              When you create an account, we collect your email address and display name. When you
              use MyTradeBook, we store the trade data you voluntarily enter — including ticker
              symbols, prices, notes, and other journal entries. We do not collect payment
              information, browsing history, or device data beyond what is necessary to operate the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. How We Use Your Data</h2>
            <p>
              Your trade data is used solely to provide you with the MyTradeBook journaling service —
              dashboards, analytics, and history. We do not sell, share, or monetize your data. We do
              not use your trade data for advertising or profiling.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase infrastructure with row-level security.
              Only you can access your own trade data. We use industry-standard encryption in transit
              and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Data Deletion</h2>
            <p>
              You can delete your account and all associated data at any time by contacting us. Upon
              request, all your data will be permanently removed from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Contact</h2>
            <p>
              For any privacy-related questions, reach out to us on{" "}
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
