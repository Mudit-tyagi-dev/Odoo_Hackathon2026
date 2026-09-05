import React from "react";
import {
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";


export const Dashboard = ({
  user,
  metrics,
  quotations,
  activities,
  onSelectQuotation,
  onViewAllQuotations,
}) => {
  const activeCount = quotations.filter(
    (q) => q.status !== "Cancelled" && q.status !== "Confirmed"
  ).length;
  const negotiationCount = quotations.filter(
    (q) => q.status === "Under Negotiation"
  ).length;
  const awaitingCount = quotations.filter(
    (q) => q.status === "Awaiting Approval"
  ).length;
  const confirmedQuotationsCount = quotations.filter(
    (q) => q.status === "Confirmed"
  ).length;
  const confirmedTotal = (metrics?.confirmedOrders || 3) + confirmedQuotationsCount;
  const latestQuotation = quotations.find((q) => q.status !== "Cancelled") || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
            CUSTOMER PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome back, {user?.customerOrg?.name || "Acme Corporation"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's what's happening with your quotations and orders.
          </p>
        </div>
        {latestQuotation && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectQuotation(latestQuotation)}
            className="self-start sm:self-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>View latest quotation</span>
          </Button>
        )}
      </div>

      {/* 4 Metric KPI Cards (Responsive grid 1-col on mobile, 2-col on tablet, 4-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Quotations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              ACTIVE QUOTATIONS
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {activeCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {activeCount > 0 ? `${activeCount} active in pipeline` : "No active quotes"}
            </div>
          </div>
        </div>

        {/* Card 2: Under Negotiation */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              UNDER NEGOTIATION
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {negotiationCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {negotiationCount > 0 ? "Open for counter-offer" : "None in negotiation"}
            </div>
          </div>
        </div>

        {/* Card 3: Awaiting Approval */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              AWAITING APPROVAL
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {awaitingCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {awaitingCount > 0 ? "Sales team reviewing" : "No pending approvals"}
            </div>
          </div>
        </div>

        {/* Card 4: Confirmed Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              CONFIRMED ORDERS
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {confirmedTotal}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {confirmedQuotationsCount > 0 ? `${confirmedQuotationsCount} recently confirmed` : (metrics?.confirmedOrdersTotalValue || "3 total orders")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split (Recent quotations + Activity feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Quotations Table / Cards */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Recent quotations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and manage your active pricing.
              </p>
            </div>
            <button
              onClick={onViewAllQuotations}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quotations List */}
          <div className="divide-y divide-slate-100">
            {quotations.slice(0, 4).map((q) => (
              <div
                key={q.id}
                onClick={() => onSelectQuotation(q)}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                        {q.id}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {q.lineItemsCount} line items · {q.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>Sales rep: <strong className="text-slate-700">{q.salesRep}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ₹{q.total?.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-slate-400">Total</div>
                  </div>
                  <Badge variant={q.status}>{q.status}</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Recent activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest updates from your account.
              </p>
            </div>
            <span className="text-slate-400">···</span>
          </div>

          <div className="py-4 space-y-4 flex-1">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {act.description}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {act.time}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={onViewAllQuotations}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              View activity timeline →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Data Protection Assurance Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-blue-950">
              Your data stays protected
            </h4>
            <p className="text-[11px] sm:text-xs text-blue-700/90 mt-0.5">
              DealFlow360 keeps your commercial conversations private and only shares approved terms with your team.
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 hidden sm:block" />
      </div>
    </div>
  );
};

export default Dashboard;
