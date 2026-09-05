import React from "react";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  CreditCard,
  User,
  Zap,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Sidebar = ({
  activeTab,
  onTabChange,
  quotationsCount = 2,
  user,
  logout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "quotations",
      label: "My Quotations",
      icon: FileText,
      badge: quotationsCount > 0 ? quotationsCount : null,
    },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "account", label: "Account", icon: User },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50/70 border-r border-slate-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            DealFlow<span className="text-emerald-600 font-extrabold">360</span>
          </span>
        </div>
        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Customer Portal Switcher Pill */}
      

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`
                w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all
                ${
                  isActive
                    ? "bg-emerald-50/90 text-emerald-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? "bg-emerald-200/70 text-emerald-800"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Support Card & Settings */}
      <div className="p-3 border-t border-slate-200/80 shrink-0 space-y-2">
        
        <button
          onClick={() => {
            if (logout) logout();
            navigate("/login", { replace: true });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50/70 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible lg+) */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on mobile when open) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
