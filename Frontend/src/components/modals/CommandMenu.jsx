import React, { useEffect, useState } from "react";
import { Search, FileText, ShoppingBag, CreditCard, User, LayoutDashboard, X } from "lucide-react";

export const CommandMenu = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: "dashboard", title: "Dashboard", category: "Navigation", icon: LayoutDashboard },
    { id: "quotations", title: "My Quotations", category: "Navigation", icon: FileText },
    { id: "orders", title: "Orders", category: "Navigation", icon: ShoppingBag },
    { id: "billing", title: "Billing & Invoices", category: "Navigation", icon: CreditCard },
    { id: "account", title: "Account & Settings", category: "Navigation", icon: User },
    { id: "q-42", title: "Quotation Q-2026-0042 (Laptop Pro 16\")", category: "Recent", target: "quotations", icon: FileText },
    { id: "so-881", title: "Order SO-2026-00881 (Warehouse Dispatch)", category: "Recent", target: "orders", icon: ShoppingBag },
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quotations, orders, invoices or pages..."
            className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400 bg-transparent"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.target || item.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition group"
                >
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandMenu;
