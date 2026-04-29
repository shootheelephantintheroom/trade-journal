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
      const { error, session } = await signUp(email, password, username || undefined);
      if (error) {
        setError(error);
      } else if (session) {
        navigate("/app", { replace: true });
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
        <div className="w-full max-w-xs mx-auto text-center space-y-4">
          <p className="text-sm font-medium text-primary mb-4">MyTradeBook</p>
          <div className="border border-profit/20 rounded-[6px] px-3 py-2">
            <p className="text-profit text-[13px]">
              Check your email to verify your account. You can close this page.
            </p>
          </div>
          {error && (
            <div className="border border-loss/20 rounded-[6px] px-3 py-2">
              <p className="text-loss text-[13px]">{error}</p>
            </div>
          )}
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="text-[13px] text-brand hover:text-brand/80 transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
          <p className="text-[13px] text-tertiary">
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
      <div className="w-full max-w-xs mx-auto">
        <p className="text-sm font-medium text-primary text-center mb-6">
          MyTradeBook
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-loss/20 rounded-[6px] px-3 py-2">
                <p className="text-loss text-[13px]">{error}</p>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-[13px] font-medium text-secondary mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-secondary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="block text-[13px] font-medium text-secondary mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors"
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
                  <span className="text-[13px] text-secondary">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-[13px] text-brand hover:text-brand/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode === "reset" && resetSent && (
              <div className="border border-profit/20 rounded-[6px] px-3 py-2">
                <p className="text-profit text-[13px]">Check your email for a reset link</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "reset" && resetSent)}
              className="w-full text-[13px] py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>

            <p className="text-center text-[13px] text-tertiary">
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
