import { useState, useEffect } from "react";
import { authApi } from "@/api/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

const COOLDOWN_KEY = "yatrivo_reset_cooldown_until";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Check persisted cooldown from localStorage on open / mount
  useEffect(() => {
    const checkCooldown = () => {
      try {
        const untilStr = localStorage.getItem(COOLDOWN_KEY);
        if (untilStr) {
          const until = parseInt(untilStr, 10);
          const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
          setCooldown(remaining);
        }
      } catch {
        // Ignore localStorage error
      }
    };

    checkCooldown();
  }, [isOpen]);

  // Ticker for 1-second interval cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(COOLDOWN_KEY);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setSubmitted(false);
      setError("");
      setLoading(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid administrator email address.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(cleanEmail);
      // Set 60-second cooldown on this device
      const expiry = Date.now() + 60000;
      try {
        localStorage.setItem(COOLDOWN_KEY, expiry.toString());
      } catch {}
      setCooldown(60);
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process request. Please try again.";
      setError(msg);
      const match = msg.match(/wait (\d+) second/i);
      if (match) {
        const secs = parseInt(match[1], 10);
        setCooldown(secs);
        try {
          localStorage.setItem(COOLDOWN_KEY, (Date.now() + secs * 1000).toString());
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#e2e8f0] relative">
        {/* Header decoration bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#0f2922] via-[#e8622a] to-[#0f2922]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-7">
          {!submitted ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#1a6b4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Reset Admin Password
              </h3>
              <p className="text-sm text-[#718096] mt-1 mb-6">
                Enter your registered admin email address. We'll send you a secure link valid for 20 minutes. If a link was requested recently, the same link will be resent.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
                    Administrator Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yatrivo3@gmail.com"
                    autoFocus
                    required
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922] transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend available in ${cooldown}s`
                  ) : (
                    "Send Password Reset Link"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Reset Link Sent
              </h3>
              <p className="text-sm text-[#718096] mt-2 mb-3">
                A password reset link has been sent to your verified administrator email:
              </p>
              <div className="bg-[#f7f8f5] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0f2922] inline-block mb-4">
                {email}
              </div>
              <p className="text-xs text-[#718096] mb-6 leading-relaxed">
                Please check your inbox and click the reset button to set your new password. This link is valid for <strong className="text-[#0f2922]">20 minutes</strong>.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium py-3 rounded-xl transition cursor-pointer"
                >
                  Return to Sign In
                </button>
                {cooldown > 0 ? (
                  <p className="text-xs text-[#718096] pt-2 text-center">
                    You can request another link in <span className="font-semibold text-[#0f2922]">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-[#718096] hover:text-[#0f2922] transition pt-2 block mx-auto cursor-pointer underline"
                  >
                    Didn't receive an email? Send again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
