import { useState, useEffect } from "react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: (email?: string) => void;
}

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setEmail(initialEmail || "");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setResendTimer(30);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Step 1: Submit Email
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid administrator email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setResendTimer(30);
    }, 700);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp.trim() || otp.trim().length < 4) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("reset");
    }, 600);
  };

  // Step 3: Set New Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 700);
  };

  const handleFinish = () => {
    onClose();
    if (onSuccess) {
      onSuccess(email);
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
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-7">
          {/* STEP 1: ENTER EMAIL */}
          {step === "email" && (
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
                Enter your registered admin email address and we'll send you a verification code to set up a new password.
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
                    Admin Email Address
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "otp" && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Check Your Inbox
              </h3>
              <p className="text-sm text-[#718096] mt-1 mb-2">
                We sent a 6-digit security code to:
              </p>
              <div className="bg-[#f7f8f5] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0f2922] inline-block mb-4">
                {email}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800 flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <div>
                  <span className="font-semibold">Demo / Preview Mode:</span>
                  <p className="mt-0.5">
                    Click{" "}
                    <button
                      type="button"
                      onClick={() => setOtp("482910")}
                      className="underline font-bold text-[#e8622a] hover:text-[#d4541f]"
                    >
                      Fill Demo Code (482910)
                    </button>{" "}
                    or enter any 6 digits to proceed.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    autoFocus
                    className="w-full text-center tracking-[0.3em] font-mono font-bold text-lg border border-[#e2e8f0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f2922] transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                    className="text-[#718096] hover:text-[#0f2922] transition"
                  >
                    ← Edit email
                  </button>
                  {resendTimer > 0 ? (
                    <span className="text-[#a0aec0]">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResendTimer(30);
                        setOtp("482910");
                      }}
                      className="text-[#e8622a] font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === "reset" && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f0f9f4] text-[#1a6b4a] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#1a6b4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Set New Password
              </h3>
              <p className="text-sm text-[#718096] mt-1 mb-6">
                Choose a strong new password for your administrator account.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoFocus
                      className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#0f2922] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#0f2922] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password & Finish"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === "success" && (
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Password Reset Successfully!
              </h3>
              <p className="text-sm text-[#718096] mt-2 mb-6">
                Your password has been changed. You can now use your new password to sign in to the Yatrivo Admin Panel.
              </p>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium py-3 rounded-xl transition cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
