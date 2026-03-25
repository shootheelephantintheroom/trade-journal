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
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resending, setResending] = useState(false);

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
        setSignupSuccess(true);
      }
    }

    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError(error.message);
    }
    setResending(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-semibold text-primary mb-1">MyTradeBook</h1>
          <div className="bg-profit-muted border border-profit/30 rounded-lg px-4 py-3">
            <p className="text-profit text-sm">
              Check your email to verify your account. You can close this page.
            </p>
          </div>
          {error && (
            <div className="bg-loss-muted border border-loss/30 rounded-lg px-3 py-2">
              <p className="text-loss text-sm">{error}</p>
            </div>
          )}
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="text-sm text-brand hover:text-brand/80 transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
          <p className="text-sm text-tertiary">
            <button
              type="button"
              onClick={() => {
                setSignupSuccess(false);
                setMode("login");
                setError(null);
              }}
              className="text-brand hover:text-brand/80 transition-colors"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-primary text-center mb-1">
          MyTradeBook
        </h1>
        <p className="text-tertiary text-center text-sm mb-8">
          {mode === "login"
            ? "Sign in to your journal"
            : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-loss-muted border border-loss/30 rounded-lg px-3 py-2">
                <p className="text-loss text-sm">{error}</p>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs text-secondary mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-transparent bg-surface-2 hover:border-border-hover focus:border-brand focus:outline-none rounded-lg px-3 py-2 text-sm text-primary placeholder-tertiary transition-colors"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-secondary mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-transparent bg-surface-2 hover:border-border-hover focus:border-brand focus:outline-none rounded-lg px-3 py-2 text-sm text-primary placeholder-tertiary transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="block text-xs text-secondary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-transparent bg-surface-2 hover:border-border-hover focus:border-brand focus:outline-none rounded-lg px-3 py-2 text-sm text-primary placeholder-tertiary transition-colors"
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
                    className="w-3.5 h-3.5 rounded border-tertiary bg-surface-1 text-brand focus:ring-brand focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-secondary">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-sm text-brand hover:text-brand/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode === "reset" && resetSent && (
              <div className="bg-profit-muted border border-profit/30 rounded-lg px-3 py-2">
                <p className="text-profit text-sm">Check your email for a reset link</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "reset" && resetSent)}
              className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 text-surface-0 font-medium text-sm py-2 rounded-lg transition-colors"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>

            <p className="text-center text-sm text-tertiary">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-brand hover:text-brand/80 transition-colors"
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
                    className="text-brand hover:text-brand/80 transition-colors"
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
