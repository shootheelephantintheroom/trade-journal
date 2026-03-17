import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setRememberMe, supabase } from "../lib/supabase";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/login?mode=reset",
      });
      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      setRememberMe(rememberMe);
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        navigate("/app", { replace: true });
      }
    } else {
      setRememberMe(true);
      const { error } = await signUp(email, password, username || undefined);
      if (error) {
        setError(error);
      } else {
        navigate("/app", { replace: true });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          MyTradeBook
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          {mode === "login"
            ? "Sign in to your journal"
            : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
        </p>

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

            {mode !== "reset" && (
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
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMeState(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-900 text-accent-600 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-sm text-accent-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode === "reset" && resetSent && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <p className="text-green-400 text-sm">Check your email for a reset link</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "reset" && resetSent)}
              className="w-full bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white font-medium text-sm py-2 rounded-lg transition-colors"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
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
                  {mode === "reset" ? "Remember your password?" : "Have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setResetSent(false);
                    }}
                    className="text-accent-400 hover:underline"
                  >
                    {mode === "reset" ? "Back to sign in" : "Sign in"}
                  </button>
                </>
              )}
            </p>
          </form>
      </div>
    </div>
  );
}
