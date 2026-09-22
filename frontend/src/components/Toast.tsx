import { useApp } from "@/context/AppContext";

export default function ToastContainer() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg text-sm font-medium text-white animate-in fade-in slide-in-from-bottom-3 pointer-events-auto ${
            t.type === "success" ? "bg-[#0f2922]" : t.type === "error" ? "bg-red-600" : "bg-[#4a5568]"
          }`}
        >
          {t.type === "success" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {t.type === "error" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
          {t.type === "info" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}
