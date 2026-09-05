import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  FileText,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  Plus,
  AlertCircle,
} from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

export const Quotations = ({
  quotations,
  onSelectQuotation,
  onOpenDeleteModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Filter & sort logic
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        const matchesQuery =
          q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.salesRep.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.status.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || q.status === statusFilter;

        const matchesDate = (() => {
          if (dateRange === "all") return true;
          const dateStr = q.date || "";
          if (dateRange === "30days") {
            return dateStr.includes("Sep") || dateStr.includes("Aug");
          }
          if (dateRange === "quarter") {
            return dateStr.includes("Sep") || dateStr.includes("Aug") || dateStr.includes("Jul");
          }
          return true;
        })();

        return matchesQuery && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "highest") return (b.total || 0) - (a.total || 0);
        if (sortBy === "lowest") return (a.total || 0) - (b.total || 0);
        return 0; // default order
      });
  }, [quotations, searchQuery, statusFilter, dateRange, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all" || dateRange !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange("all");
    setSortBy("newest");
  };

  const dateLabel =
    dateRange === "30days"
      ? "Last 30 days"
      : dateRange === "quarter"
      ? "Current quarter"
      : "Date range";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
            WORKSPACE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
            My quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare offers, negotiate terms, and confirm when you're ready
          </p>
        </div>
        {/* Date range dropdown button */}
        <div className="relative self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRangeOpen(!dateRangeOpen)}
            className={`gap-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs ${dateRange !== "all" ? "border-blue-500 text-blue-700 font-semibold" : ""}`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          {dateRangeOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-20 text-xs">
              <button
                onClick={() => {
                  setDateRange("30days");
                  setDateRangeOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${dateRange === "30days" ? "text-blue-600 font-semibold bg-blue-50/60" : "text-slate-700"}`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  setDateRange("quarter");
                  setDateRangeOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${dateRange === "quarter" ? "text-blue-600 font-semibold bg-blue-50/60" : "text-slate-700"}`}
              >
                Current quarter (Q3 2026)
              </button>
              <button
                onClick={() => {
                  setDateRange("all");
                  setDateRangeOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${dateRange === "all" ? "text-blue-600 font-semibold bg-blue-50/60" : "text-slate-700"}`}
              >
                All time
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quotation number, sales rep, or status..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Status Filter & Sort Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="Under Negotiation">Under Negotiation</option>
              <option value="Sent">Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Awaiting Approval">Awaiting Approval</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="highest">Highest total</option>
              <option value="lowest">Lowest total</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
            <span>Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Status: {statusFilter}
              </span>
            )}
            {dateRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Date: {dateLabel}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 font-medium underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Quotations Table (Responsive with horizontal scrolling and sleek borders) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-6">QUOTATION</th>
                <th className="py-3.5 px-6">SALES REPRESENTATIVE</th>
                <th className="py-3.5 px-6">TOTAL</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6">LAST UPDATED</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No quotations found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/70 transition group cursor-pointer"
                    onClick={() => onSelectQuotation(q)}
                  >
                    {/* Quotation ID & items */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition block">
                            {q.id}
                          </span>
                          <span className="text-slate-400 text-[11px] block mt-0.5">
                            {q.lineItemsCount} line items · {q.date}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sales Rep */}
                    <td className="py-4 px-6 text-slate-700">
                      <div className="font-semibold text-slate-900">{q.salesRep}</div>
                      <div className="text-slate-400 text-[11px]">
                        {q.salesRepRole || "Account executive"}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                      ₹{q.total?.toLocaleString("en-IN")}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <Badge variant={q.status}>{q.status}</Badge>
                    </td>

                    {/* Last Updated */}
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {q.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {/* View details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectQuotation(q)}
                          className="h-8 px-2.5 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>View</span>
                        </Button>

                        {/* Cancel / Delete with Heavy Custom Validation */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenDeleteModal(q)}
                          className={`h-8 px-2 text-xs ${
                            q.status === "Confirmed"
                              ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }`}
                          title={
                            q.status === "Confirmed"
                              ? "Test blocked deletion on confirmed item"
                              : "Cancel quotation"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quotations;
