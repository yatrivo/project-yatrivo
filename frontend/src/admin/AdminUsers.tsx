import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/context/AppContext";
import { usersApi, type ManagedAdminUser, type CreateAdminPayload } from "@/api/users";

function initials(name: string | null, email: string) {
  if (name && name.trim()) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(isoString: string | null) {
  if (!isoString) return "Never";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoString;
  }
}

interface AddAdminModalProps {
  onClose: () => void;
  onSuccess: (admin: ManagedAdminUser) => void;
}

function AddAdminModal({ onClose, onSuccess }: AddAdminModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Administrator's full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Initial default password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateAdminPayload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        password
      };
      const created = await usersApi.createAdmin(payload);
      onSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create administrator");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Add New Administrator
          </h3>
          <button
            onClick={onClose}
            className="text-[#a3bfb5] hover:text-white transition p-1 cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yatrivo.com"
                required
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">
                Administrative Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
              >
                <option value="admin">Operations Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#4a5568]">
                  Initial Default Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#e8622a] hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
              <p className="text-xs text-[#718096] mt-1.5 leading-relaxed">
                Provide an initial password to hand to the administrator. They will be required to set their own permanent password on first login.
              </p>
            </div>
          </div>

          <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsers() {
  const { showToast, adminUser, adminRole } = useApp();
  const [admins, setAdmins] = useState<ManagedAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isSuperAdmin = adminRole === "superAdmin" || adminUser?.role === "super_admin";

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await usersApi.listAdmins();
      setAdmins(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load administrative accounts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddSuccess = (newAdmin: ManagedAdminUser) => {
    setAdmins((prev) => [...prev, newAdmin]);
    setShowAddModal(false);
    showToast(`Administrator ${newAdmin.fullName || newAdmin.email} created successfully.`, "success");
  };

  const handleToggleStatus = async (admin: ManagedAdminUser) => {
    if (admin.id === adminUser?.id) {
      showToast("You cannot deactivate your own administrative account.", "error");
      return;
    }

    const newStatus = admin.status === "active" ? "disabled" : "active";
    const confirmMessage =
      newStatus === "disabled"
        ? `Are you sure you want to deactivate ${admin.fullName || admin.email}? They will immediately be logged out and cannot sign in.`
        : `Are you sure you want to re-activate ${admin.fullName || admin.email}?`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoadingId(admin.id);
    try {
      const updated = await usersApi.updateStatus(admin.id, newStatus);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
      showToast(
        `Administrator ${admin.fullName || admin.email} is now ${newStatus === "active" ? "active" : "deactivated"}.`,
        "info"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update admin status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = admins.filter((u) => {
    const q = search.toLowerCase();
    const nameMatch = u.fullName?.toLowerCase().includes(q);
    const emailMatch = u.email.toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
          Access Restricted
        </h2>
        <p className="text-[#4a5568] text-sm leading-relaxed">
          The Administrator Management System is restricted to Super Administrators only. Please contact an organization Super Admin if you need assistance with account permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {showAddModal && (
        <AddAdminModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Administrator Management
          </h2>
          <p className="text-[#718096] text-sm mt-0.5">
            Super Administrator console for managing team access and security.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-2"
        >
          <span>+ Add Admin</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAdmins}
            className="text-xs font-semibold underline hover:no-underline ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-72">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-full focus:outline-none focus:border-[#0f2922] bg-white"
          />
        </div>
        <div className="text-xs text-[#718096]">
          {filtered.length} of {admins.length} administrator{admins.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-5 py-3.5 text-left">Administrator</th>
                <th className="px-5 py-3.5 text-left">Email Address</th>
                <th className="px-5 py-3.5 text-left">Role</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#718096]">
                    <div className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-[#0f2922]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading administrators...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#a0aec0]">
                    {search ? "No administrators matching your search." : "No administrative accounts found."}
                  </td>
                </tr>
              ) : (
                filtered.map((admin) => {
                  const isCurrent = admin.id === adminUser?.id;
                  const isActive = admin.status === "active";
                  const isActionLoading = actionLoadingId === admin.id;

                  return (
                    <tr key={admin.id} className="hover:bg-[#f7f8f5] transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              admin.role === "super_admin" ? "bg-[#e8622a]" : "bg-[#0f2922]"
                            }`}
                          >
                            {initials(admin.fullName, admin.email)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0f2922] flex items-center gap-2">
                              <span>{admin.fullName || "Unnamed Admin"}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            {admin.mustChangePassword && (
                              <div className="text-[10px] text-amber-600 font-medium">
                                Pending initial password change
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#4a5568]">{admin.email}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                            admin.role === "super_admin"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {admin.role === "super_admin" ? "Super Admin" : "Operations Admin"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#718096] text-xs">
                        {formatDate(admin.lastLoginAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isCurrent ? (
                          <span className="text-xs text-[#a0aec0] italic">Self account</span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={isActionLoading}
                            className={`text-xs font-semibold px-3 py-1 rounded-md transition cursor-pointer disabled:opacity-50 ${
                              isActive
                                ? "text-red-600 hover:bg-red-50 border border-red-200"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {isActionLoading
                              ? "Updating..."
                              : isActive
                              ? "Deactivate"
                              : "Re-activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
