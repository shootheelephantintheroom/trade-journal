import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        navigate("/app", { replace: true });
      }
    } else {
      const { error } = await signUp(email, password, username || undefined);
      if (error) {
        setError(error);
      } else {
        setSignupSuccess(true);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          TradeBook
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          {mode === "login" ? "Sign in to your journal" : "Create your account"}
        </p>

        {signupSuccess ? (
          <div className="bg-accent-600/10 border border-accent-600/30 rounded-lg p-4 text-center">
            <p className="text-accent-400 text-sm font-medium mb-1">
              Check your email
            </p>
            <p className="text-gray-400 text-xs">
              We sent a confirmation link to {email}
            </p>
            <button
              onClick={() => {
                setMode("login");
                setSignupSuccess(false);
              }}
              className="mt-4 text-sm text-accent-400 hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-500"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white font-medium text-sm py-2 rounded-lg transition-colors"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-accent-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-accent-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
