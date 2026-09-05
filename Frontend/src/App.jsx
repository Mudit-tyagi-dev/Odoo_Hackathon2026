import React, { useState } from "react";
import ToastProvider from "./components/ui/Toast";
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
import {
  INITIAL_USER,
  INITIAL_METRICS,
  INITIAL_QUOTATIONS,
  INITIAL_ORDERS,
  INITIAL_BILLING,
  INITIAL_ACTIVITIES,
} from "./services/mockData";

function PortalApp() {
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(INITIAL_USER);
  const [quotations, setQuotations] = useState(INITIAL_QUOTATIONS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [billingData, setBillingData] = useState(INITIAL_BILLING);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Modals & Navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);

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

  // Handle quotation update (e.g. counter offer or confirmation)
  const handleUpdateQuotation = (updated) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
    setSelectedQuotation(updated);
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
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Responsive Sidebar (Desktop fixed + Mobile slide-in drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleNavigate}
        quotationsCount={activeQuotationsCount}
        user={user}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header with Search, Notifications, Profile */}
        <Header
          user={user}
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

export default function App() {
  return (
    <ToastProvider>
      <PortalApp />
    </ToastProvider>
  );
}