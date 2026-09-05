import React, { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import Orders from "./pages/Orders";
import Billing from "./pages/Billing";
import Account from "./pages/Account";
import QuotationDetailModal from "./components/modals/QuotationDetailModal";
import DeleteQuotationModal from "./components/modals/DeleteQuotationModal";
import CommandMenu from "./components/modals/CommandMenu";
import { useAuth } from "./context/AuthContext";
import {
  INITIAL_USER,
  INITIAL_METRICS,
  INITIAL_QUOTATIONS,
  INITIAL_ORDERS,
  INITIAL_BILLING,
  INITIAL_ACTIVITIES,
} from "./services/mockData";

export function PortalApp() {
  const { user: authUser, logout } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(() => {
    if (authUser) {
      return {
        ...INITIAL_USER,
        ...authUser,
        customerOrg: {
          ...INITIAL_USER.customerOrg,
          name: authUser.company || INITIAL_USER.customerOrg.name,
        },
      };
    }
    return INITIAL_USER;
  });

  const [quotations, setQuotations] = useState(INITIAL_QUOTATIONS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [billingData, setBillingData] = useState(INITIAL_BILLING);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Modals & Navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);

  // Sync authUser updates
  useEffect(() => {
    if (authUser) {
      setUser((prev) => ({
        ...prev,
        ...authUser,
        customerOrg: {
          ...prev.customerOrg,
          name: authUser.company || prev.customerOrg?.name || "Acme Corporation",
        },
      }));
    }
  }, [authUser]);

  // Global keyboard shortcut for Command Menu (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle successful deletion or cancellation
  const handleDeleteSuccess = (id) => {
    // 1. If it's a quotation
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "Cancelled" } : q))
    );

    // 2. Add an activity log entry
    setActivities((prev) => [
      {
        id: "act-" + Date.now(),
        title: "Record cancelled",
        description: `${id} was cancelled from customer portal`,
        time: "Just now",
        type: "cancellation",
      },
      ...prev,
    ]);
  };

  // Handle quotation update (counter offer or confirmation)
  const handleUpdateQuotation = (updated) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
    setSelectedQuotation(updated);

    // If quotation confirmed, auto-generate order and activity log
    if (updated.status === "Confirmed") {
      const existingOrder = orders.find((o) => o.quotationId === updated.id);
      if (!existingOrder) {
        const newOrder = {
          id: `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          quotationId: updated.id,
          customer: user?.customerOrg?.name || "Acme Corporation",
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          total: updated.total,
          status: "Processing",
          itemsCount: updated.lineItemsCount || updated.items?.length || 2,
          fulfillmentStage: "Order Confirmed - Staging for Dispatch",
        };
        setOrders((prev) => [newOrder, ...prev]);

        setActivities((prev) => [
          {
            id: "act-" + Date.now(),
            title: "Quotation confirmed into order",
            description: `${updated.id} confirmed by customer, created ${newOrder.id}`,
            time: "Just now",
            type: "confirmation",
          },
          ...prev,
        ]);
      }
    } else if (updated.status === "Awaiting Approval") {
      setActivities((prev) => [
        {
          id: "act-" + Date.now(),
          title: "Counter-offer submitted",
          description: `Customer submitted counter-offer on ${updated.id}`,
          time: "Just now",
          type: "counter_offer",
        },
        ...prev,
      ]);
    }
  };

  // Navigate helper
  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeQuotationsCount = quotations.filter(
    (q) => q.status !== "Cancelled" && q.status !== "Confirmed"
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Responsive Sidebar (Desktop fixed + Mobile slide-in drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleNavigate}
        quotationsCount={activeQuotationsCount}
        user={user}
        logout={logout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header with Search, Notifications, Profile */}
        <Header
          user={user}
          logout={logout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          onNavigate={handleNavigate}
        />

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === "dashboard" && (
            <Dashboard
              user={user}
              metrics={INITIAL_METRICS}
              quotations={quotations}
              activities={activities}
              onSelectQuotation={(q) => setSelectedQuotation(q)}
              onViewAllQuotations={() => handleNavigate("quotations")}
            />
          )}

          {activeTab === "quotations" && (
            <Quotations
              quotations={quotations}
              onSelectQuotation={(q) => setSelectedQuotation(q)}
              onOpenDeleteModal={(q) => setQuotationToDelete(q)}
            />
          )}

          {activeTab === "orders" && (
            <Orders
              orders={orders}
              onOpenDeleteModal={(order) => setQuotationToDelete(order)}
              onSelectQuotationById={(qid) => {
                const found = quotations.find((q) => q.id === qid);
                if (found) {
                  setSelectedQuotation(found);
                } else {
                  handleNavigate("quotations");
                }
              }}
            />
          )}

          {activeTab === "billing" && <Billing billingData={billingData} />}

          {activeTab === "account" && (
            <Account user={user} onUpdateUser={setUser} />
          )}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      {/* 1. Quotation Details & Negotiation Workspace */}
      <QuotationDetailModal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onUpdateQuotation={handleUpdateQuotation}
      />

      {/* 2. PO / Quotation Delete & Cancellation with Heavy Custom Validation */}
      <DeleteQuotationModal
        isOpen={!!quotationToDelete}
        onClose={() => setQuotationToDelete(null)}
        quotation={quotationToDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {/* 3. Global Command Menu (⌘K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default PortalApp;