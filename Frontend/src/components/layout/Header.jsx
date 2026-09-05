import React from "react";
import { Search, Bell, Menu, ChevronDown, Shield } from "lucide-react";
import { useToast } from "../ui/Toast";

export const Header = ({
  user,
  onOpenMobileMenu,
  onOpenCommandMenu,
  onNavigate,
}) => {
  const toast = useToast();

  const handleNotificationClick = () => {
    toast.info(
      "Aarav Mehta submitted counter-proposal approval for Q-2026-0042 (12 min ago).",
      "Recent Notification"
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Trigger for Command Palette) */}
        <div
          onClick={onOpenCommandMenu}
          className="flex items-center gap-2.5 w-full max-w-md px-3.5 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition cursor-pointer text-xs select-none shadow-2xs"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="flex-1 truncate">Search quotations, orders...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Badge */}
        <div
          onClick={() => onNavigate("account")}
          className="flex items-center gap-2.5 pl-1 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs shrink-0 ring-1 ring-purple-200">
            {user?.initials || "RK"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.name || "Rohan Kapoor"}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              {user?.customerOrg?.name || "Acme Corporation"}
            </div>
          </div>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;
