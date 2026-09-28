import { useState } from "react";
import { useNavigate, useSearchParams, Navigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function AdminLogin() {
  const { adminLogin, adminLoggedIn, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const returnUrl = fromParam ? decodeURIComponent(fromParam) : "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);


  if (adminLoggedIn) {
    return <Navigate to={returnUrl} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(cleanEmail, password);
      if (res.success) {
        navigate(returnUrl, { replace: true });
        showToast("Welcome to Yatrivo Admin!", "success");
      } else {
        setError(res.error || "Invalid credentials. Please try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f2922] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#e8622a] flex items-center justify-center group-hover:ring-2 group-hover:ring-white/30 transition">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>Y</span>
            </div>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-serif, serif)" }}>Yatrivo</span>
          </Link>
          <p className="text-[#a3bfb5] text-sm">Travel Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[#0f2922] mb-1" style={{ fontFamily: "var(--font-serif, serif)" }}>Login to Admin</h2>
          <p className="text-[#718096] text-sm mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yatrivo3@gmail.com"
                className="w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922] transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#4a5568]">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#e8622a] hover:text-[#d4541f] transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#0f2922] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0aec0] hover:text-[#4a5568] transition"
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>


            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Login to Admin"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#0f2922] transition flex items-center gap-1">
              ← Return to public website
            </Link>
            <span>Authorized access</span>
          </div>

          <p className="text-center text-xs text-[#718096] mt-4">
            Super Admin: <span className="font-mono bg-gray-100 px-1 rounded text-[#0f2922]">yatrivo3@gmail.com</span>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={email}
        onSuccess={(newEmail) => {
          if (newEmail) setEmail(newEmail);
          showToast("Password reset successfully. You can now log in.", "success");
        }}
      />
    </div>
  );
}

