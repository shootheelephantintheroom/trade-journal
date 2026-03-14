import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white">
            TradeBook
          </h1>
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-10">
        <div className="text-center max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Journal Your Trades.
            <br />
            Fix Your Mistakes.
            <br />
            <span className="text-accent-400">Trade Better.</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            A trading journal built for active day traders who want to improve.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Log Trades
            </h3>
            <p className="text-xs text-gray-400">
              Record entries, exits, emotions, and grade every trade.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">👀</div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Track Missed Opportunities
            </h3>
            <p className="text-xs text-gray-400">
              Log the ones that got away so you stop hesitating.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Dashboard Analytics
            </h3>
            <p className="text-xs text-gray-400">
              Win rate, P&L, streaks, and daily breakdowns at a glance.
            </p>
          </div>
        </div>

        {/* Dashboard Preview Placeholder */}
        <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl h-48 flex items-center justify-center">
          <span className="text-gray-600 text-sm">
            Dashboard screenshot coming soon
          </span>
        </div>

        {/* CTA */}
        <Link
          to="/login?mode=signup"
          className="bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors"
        >
          Get Started — Free Beta
        </Link>

        {/* Beta Note */}
        <p className="text-gray-500 text-xs">
          Currently in free beta. All features included.
        </p>
      </main>
    </div>
  );
}
