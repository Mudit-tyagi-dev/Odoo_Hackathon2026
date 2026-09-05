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
} from "lucide-react";

export const Sidebar = ({
  activeTab,
  onTabChange,
  quotationsCount = 2,
  user,
  isMobileOpen,
  onCloseMobile,
}) => {
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
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600 font-extrabold">360</span>
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
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition cursor-pointer">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200/60 shrink-0">
              {user?.customerOrg?.shortCode || "AC"}
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
                Customer portal
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate block mt-0.5">
                {user?.customerOrg?.name || "Acme Corporation"}
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
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
                    ? "bg-blue-50/90 text-blue-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? "bg-blue-200/70 text-blue-800"
                      : "bg-blue-100 text-blue-700"
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
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Need help?
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Talk to our team
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => {
            onTabChange("account");
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Portal settings</span>
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
