import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/context/AppContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin";
  lastActive: string;
}

const INITIAL_ADMINS: AdminUser[] = [
  { id: "1", name: "Yatrivo Super Admin", email: "yatrivo3@gmail.com", role: "Super Admin", lastActive: "Just now" },
  { id: "2", name: "Operations Admin", email: "admin@yatrivo.com", role: "Admin", lastActive: "Today" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AddAdminModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: AdminUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Super Admin" | "Admin">("Admin");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Name is required.");
    if (!email.trim()) errs.push("Email is required.");
    setErrors(errs);
    if (errs.length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onAdd({
      id: String(Date.now()),
      name: name.trim(),
      email: email.trim(),
      role,
      lastActive: "Never",
    });
    setLoading(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Admin</h3>
          <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm space-y-1">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yatrivo.com" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "Super Admin" | "Admin")} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                <option>Admin</option>
                <option>Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Temporary Password <span className="text-[#a0aec0] font-normal">(optional)</span></label>
              <input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Leave blank to auto-generate" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>

          <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Adding...
                </>
              ) : "Add Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsers() {
  const { showToast } = useApp();
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = admins.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleAdd = (newAdmin: AdminUser) => {
    setAdmins((prev) => [newAdmin, ...prev]);
    setShowAddModal(false);
    showToast(`${newAdmin.name} added as ${newAdmin.role}.`, "success");
  };

  const handleRemove = (admin: AdminUser) => {
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    showToast(`${admin.name} removed.`, "info");
  };

  return (
    <div className="p-6 space-y-5">
      {showAddModal && <AddAdminModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Admin Management</h2>
          <p className="text-[#718096] text-sm mt-0.5">{admins.length} admin{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add Admin
        </button>
      </div>

      <div className="relative w-64">
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admins..." className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-full focus:outline-none focus:border-[#0f2922]" />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Last Active</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[#a0aec0]">No admins found</td></tr>
              ) : filtered.map((admin) => (
                <tr key={admin.id} className="hover:bg-[#f7f8f5] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${admin.role === "Super Admin" ? "bg-[#e8622a]" : "bg-[#0f2922]"}`}>
                        {initials(admin.name)}
                      </div>
                      <span className="font-medium text-[#0f2922]">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#4a5568]">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${admin.role === "Super Admin" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#718096]">{admin.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => showToast("Edit admin coming soon.", "info")}
                        className="text-[#0f2922] hover:text-[#e8622a] text-xs font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(admin)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
