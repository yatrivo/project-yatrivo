import { useState } from "react";
import { useApp } from "@/context/AppContext";

export type AdminPage =
  | "dashboard" | "enquiries" | "enquiry-detail" | "trips" | "trip-editor"
  | "trip-instances" | "destinations" | "bookings" | "users" | "reviews"
  | "media" | "content" | "analytics" | "notifications" | "settings" | "audit-logs";

interface AdminLayoutProps {
  adminPage: AdminPage;
  setAdminPage: (page: AdminPage) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2}/></svg> },
  { id: "enquiries", label: "Enquiries", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
  { id: "trips", label: "Trips", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg> },
  { id: "destinations", label: "Destinations", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { id: "bookings", label: "Bookings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
  { id: "users", label: "Admins", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
  { id: "reviews", label: "Reviews", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> },
  { id: "media", label: "Media", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
  { id: "content", label: "Content", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
  { id: "settings", label: "Settings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { id: "audit-logs", label: "Audit Logs", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
];

export default function AdminLayout({ adminPage, setAdminPage, children }: AdminLayoutProps) {
  const { adminLogout, adminRole, adminUser, enquiries } = useApp();
  const isSuperAdmin = adminRole === "superAdmin" || adminUser?.role === "super_admin";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const unreadEnquiries = enquiries.filter((e) => e.status === "Received").length;

  const activePage = ["enquiry-detail"].includes(adminPage) ? "enquiries" : ["trip-editor"].includes(adminPage) ? "trips" : adminPage;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      {collapsed ? (
        <div
          className="p-4 border-b border-[#1a3d31] flex items-center justify-center cursor-pointer group"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <div className="w-9 h-9 rounded-xl bg-[#e8622a] flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-white/30 transition">
            <span className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>Y</span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-[#1a3d31] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e8622a] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>Y</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base leading-tight" style={{ fontFamily: "var(--font-serif, serif)" }}>Yatrivo</div>
            <div className="text-[#7aab95] text-xs">Admin Panel</div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-[#a3bfb5] hover:bg-[#1a3d31] hover:text-white transition shrink-0"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setAdminPage(item.id); setMobileOpen(false); }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative ${
                isActive
                  ? "bg-[#1a3d31] text-white"
                  : "text-[#a3bfb5] hover:bg-[#1a3d31] hover:text-white"
              }`}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e8622a] rounded-r-full" />}
              <span className="shrink-0 relative">
                {item.icon}
                {item.id === "enquiries" && unreadEnquiries > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#e8622a] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadEnquiries}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {(item.id === "settings" || item.id === "audit-logs") && !isSuperAdmin && (
                    <span className="ml-auto text-[10px] bg-[#1a3d31] text-[#7aab95] rounded px-1">Pro</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#1a3d31]">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#e8622a] flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
              {adminUser?.fullName?.[0] || (isSuperAdmin ? "S" : "A")}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">
                {adminUser?.fullName || (isSuperAdmin ? "Super Admin" : "Admin")}
              </div>
              <div className="text-[#7aab95] text-xs truncate max-w-[140px]" title={adminUser?.email || "admin@yatrivo.com"}>
                {adminUser?.email || "admin@yatrivo.com"}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3bfb5] hover:bg-red-900/30 hover:text-red-400 transition text-sm cursor-pointer"
          title={collapsed ? "Logout" : undefined}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f7f8f5] overflow-hidden">
      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLogoutConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="bg-[#0f2922] px-6 py-5">
              <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>Log out of Yatrivo Admin?</h3>
            </div>
            <div className="p-6">
              <p className="text-[#4a5568] text-sm">You will need to enter your password to access the admin panel again.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLogoutConfirmOpen(false);
                  await adminLogout();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0f2922] transition-all duration-300 ${collapsed ? "w-16" : "w-60"} shrink-0`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-[#0f2922] flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-[#4a5568] hover:bg-[#f7f8f5] transition md:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-[#0f2922] capitalize">
              {NAV_ITEMS.find(n => n.id === activePage)?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[#718096] text-xs">
            <span>Yatrivo Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
