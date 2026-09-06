import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Edit3,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { validateCounterOffer } from "../../utils/validation";
import { useToast } from "../ui/Toast";
import BillInvoiceModal from "./BillInvoiceModal";
import quotationService, {
  formatQuotationStatus,
  QUOTATION_STATUSES,
} from "../../services/quotationService";
import { parseApiError } from "../../utils/errorHandler";
import { formatCurrency } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";

/**
 * Returns what actions are available for a given status and role.
 * Handles both backend role names and frontend mock role names.
 */
function getAvailableActions(status, role) {
  const actions = {
    canSubmit: false,
    canApprove: false,
    canReject: false,
    canConfirm: false,
    canClaim: false,
    canCounterOffer: false,
    canEdit: false,
  };

  const isCustomer = role === "customer";
  // Handle both backend (sales_rep, sales_manager) and frontend mock (sales_executive)
  const isSales = role === "sales_rep" || role === "sales_executive" || role === "sales_manager";
  const isFinance = role === "finance";
  const isAdmin = role === "admin";
  const isApprover = isAdmin || isSales || isFinance; // Anyone who can approve/reject

  switch (status) {
    case QUOTATION_STATUSES.DRAFT:
      actions.canSubmit = isCustomer || isSales || isAdmin;
      actions.canEdit = isCustomer || isSales || isAdmin;
      break;
    case QUOTATION_STATUSES.PENDING_APPROVAL:
      actions.canApprove = isApprover;
      actions.canReject = isApprover;
      actions.canClaim = isSales;
      break;
    case QUOTATION_STATUSES.APPROVED:
      actions.canConfirm = isCustomer || isAdmin;
      actions.canCounterOffer = isCustomer;
      break;
    case QUOTATION_STATUSES.NEGOTIATING:
      actions.canApprove = isApprover;
      actions.canReject = isApprover;
      break;
    case QUOTATION_STATUSES.REJECTED:
      actions.canEdit = isAdmin || isSales;
      break;
    case QUOTATION_STATUSES.CONFIRMED:
      // No further workflow actions
      break;
    default:
      break;
  }

  return actions;
}

export const QuotationDetailModal = ({
  isOpen,
  onClose,
  quotation,
  onUpdateQuotation,
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const userRole = user?.role || "customer";

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("15");
  const [counterNote, setCounterNote] = useState("");
  const [counterErrors, setCounterErrors] = useState({});
  const [counterWarnings, setCounterWarnings] = useState({});
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState("");

  // Chat message state
  const [chatInput, setChatInput] = useState("");
  const [conversation, setConversation] = useState(
    quotation?.conversation || []
  );

  // Synchronize state when quotation or modal open state changes
  useEffect(() => {
    if (quotation) {
      setConversation(quotation.conversation || []);
      setChatInput("");
      setShowCounterForm(false);
      setShowRejectForm(false);
      setDiscountPercent("15");
      setCounterNote("");
      setRejectReason("");
      setCounterErrors({});
      setCounterWarnings({});
      setActionError("");
    }
  }, [quotation?.id, isOpen]);

  if (!isOpen || !quotation) return null;

  const rawId = quotation.rawId;
  const status = quotation.status || "draft";
  const actions = getAvailableActions(status, userRole);

  // Calculate counter offer math
  const originalTotal = quotation.total || 0;
  const numDiscount = parseFloat(discountPercent) || 0;
  const calculatedDiscountAmount = (originalTotal * numDiscount) / 100;
  const calculatedNewTotal = Math.max(0, originalTotal - calculatedDiscountAmount);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: "msg-" + Date.now(),
      sender: user?.name || "You",
      senderRole: user?.role || "Customer",
      avatarText: (user?.name || "U").substring(0, 2).toUpperCase(),
      isCustomer: userRole === "customer",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: chatInput.trim(),
    };

    setConversation((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  /**
   * Submit quotation for approval — POST /quotations/{id}/submit
   */
  const handleSubmitForApproval = async () => {
    if (!rawId) {
      toast.error("Quotation ID not found. Cannot submit.");
      return;
    }
    setIsActionLoading(true);
    setActionError("");
    try {
      const updated = await quotationService.submitQuotation(rawId);
      toast.success(
        `Quotation ${quotation.id} submitted for approval.`,
        "Submitted"
      );
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: updated.status,
          stage: formatQuotationStatus(updated.status),
          lastUpdated: "Just now",
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to submit quotation.";
      setActionError(msg);
      toast.error(msg, "Submit Failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Approve quotation — POST /quotations/{id}/approve
   */
  const handleApprove = async () => {
    if (!rawId) return;
    setIsActionLoading(true);
    setActionError("");
    try {
      const updated = await quotationService.approveQuotation(rawId);
      toast.success(
        `Quotation ${quotation.id} has been approved.`,
        "Approved"
      );
      const sysMsg = {
        id: "msg-" + Date.now(),
        sender: user?.name || "Admin",
        senderRole: "Approver",
        isCustomer: false,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: `Quotation approved by ${user?.name || "admin"}.`,
      };
      setConversation((prev) => [...prev, sysMsg]);
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: updated.status,
          stage: formatQuotationStatus(updated.status),
          lastUpdated: "Just now",
          conversation: [...conversation, sysMsg],
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to approve quotation.";
      setActionError(msg);
      toast.error(msg, "Approve Failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Reject quotation — POST /quotations/{id}/reject
   */
  const handleReject = async () => {
    if (!rawId) return;
    setIsActionLoading(true);
    setActionError("");
    try {
      const updated = await quotationService.rejectQuotation(rawId, rejectReason);
      toast.warning(
        `Quotation ${quotation.id} has been rejected.`,
        "Rejected"
      );
      const sysMsg = {
        id: "msg-" + Date.now(),
        sender: user?.name || "Admin",
        senderRole: "Approver",
        isCustomer: false,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: `Quotation rejected${rejectReason ? `: "${rejectReason}"` : "."}`,
      };
      setConversation((prev) => [...prev, sysMsg]);
      setShowRejectForm(false);
      setRejectReason("");
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: updated.status,
          stage: formatQuotationStatus(updated.status),
          lastUpdated: "Just now",
          conversation: [...conversation, sysMsg],
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to reject quotation.";
      setActionError(msg);
      toast.error(msg, "Reject Failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Confirm quotation (customer acceptance) — POST /quotations/{id}/confirm
   */
  const handleConfirm = async () => {
    if (!rawId) return;
    if (status === QUOTATION_STATUSES.CONFIRMED) {
      toast.info("This quotation has already been confirmed.");
      return;
    }
    setIsActionLoading(true);
    setActionError("");
    try {
      const updated = await quotationService.confirmQuotation(rawId);
      toast.success(
        `Quotation ${quotation.id} confirmed! This has been converted to an order.`,
        "Quotation Confirmed"
      );
      const sysMsg = {
        id: "msg-" + Date.now(),
        sender: user?.name || "Customer",
        senderRole: "Customer",
        isCustomer: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: `Quotation accepted and confirmed by ${user?.name || "customer"}.`,
      };
      setConversation((prev) => [...prev, sysMsg]);
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: updated.status,
          stage: formatQuotationStatus(updated.status),
          lastUpdated: "Just now",
          conversation: [...conversation, sysMsg],
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to confirm quotation.";
      setActionError(msg);
      toast.error(msg, "Confirm Failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Claim quotation (sales rep claims ownership) — POST /quotations/{id}/claim
   */
  const handleClaim = async () => {
    if (!rawId) return;
    setIsActionLoading(true);
    setActionError("");
    try {
      const updated = await quotationService.claimQuotation(rawId);
      toast.success(
        `You have claimed quotation ${quotation.id}.`,
        "Quotation Claimed"
      );
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: updated.status,
          salesRep: user?.name || quotation.salesRep,
          lastUpdated: "Just now",
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to claim quotation.";
      setActionError(msg);
      toast.error(msg, "Claim Failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Counter-offer — uses PATCH /quotations/{id} to update lines with revised discount
   */
  const handleCounterOfferSubmit = async (e) => {
    e.preventDefault();

    const validation = validateCounterOffer(quotation, {
      requestedDiscountPercent: discountPercent,
      message: counterNote,
    });

    if (!validation.isValid) {
      setCounterErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError, "Invalid Counter-Offer");
      return;
    }

    setCounterErrors({});
    setCounterWarnings(validation.warnings);
    setIsSubmittingCounter(true);

    try {
      if (!rawId || !(quotation.lines || []).length) {
        throw new Error("Cannot submit counter-offer: no quotation lines found.");
      }

      // Build updated lines with the new discount percent applied to all lines
      const newDiscountFraction = numDiscount / 100;
      const updatedLines = (quotation.lines || []).map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: parseFloat(line.unit_price),
        // Send as fraction directly (already 0-1 from raw API data)
        // UI discount_pct in quotation.lines is raw 0-1 from API
        discount_pct: newDiscountFraction,
        line_type: line.line_type,
        subscription_plan_id: line.subscription_plan_id || null,
      }));

      await quotationService.updateQuotation(rawId, { lines: updatedLines });

      const offerMsg = {
        id: "msg-" + Date.now(),
        sender: user?.name || "Customer",
        senderRole: "Customer",
        isCustomer: userRole === "customer",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: `Submitted counter-offer requesting ${discountPercent}% discount (Proposed total: ${formatCurrency(Math.round(calculatedNewTotal))}). Note: ${counterNote}`,
      };

      setConversation((prev) => [...prev, offerMsg]);
      setShowCounterForm(false);
      setDiscountPercent("15");
      setCounterNote("");

      toast.success(
        `Counter-offer of ${discountPercent}% submitted successfully.`,
        "Counter-Offer Sent"
      );

      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          lastUpdated: "Just now",
          conversation: [...conversation, offerMsg],
        });
      }
    } catch (err) {
      const msg = parseApiError(err) || "Failed to submit counter-offer.";
      setActionError(msg);
      toast.error(msg, "Counter-Offer Failed");
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Quotations</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">{quotation.id}</span>
            <Badge variant={status}>{formatQuotationStatus(status)}</Badge>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError("")}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quotation details, line items, pricing */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header section */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
                  QUOTATION DETAIL
                </span>
                <Badge variant={status}>{formatQuotationStatus(status)}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                {quotation.id}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-xs text-slate-500">
                <p>
                  Customer #{quotation.customer_id} · Prepared by{" "}
                  <strong className="text-slate-700">{quotation.salesRep}</strong>
                </p>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Created: <strong className="text-slate-600">{quotation.date}</strong></span>
                  <span>Valid until: <strong className="text-slate-600">{quotation.validUntil}</strong></span>
                </div>
              </div>
            </div>

            {/* Workflow Action Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Actions:
              </span>

              {actions.canSubmit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSubmitForApproval}
                  disabled={isActionLoading}
                  className="gap-1.5 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit for Approval
                </Button>
              )}

              {actions.canApprove && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  className="gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-3.5 h-3.5" />
                  )}
                  Approve
                </Button>
              )}

              {actions.canReject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  disabled={isActionLoading}
                  className="gap-1.5 text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Reject
                </Button>
              )}

              {actions.canConfirm && (
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={isActionLoading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Accept & Confirm
                </Button>
              )}

              {actions.canClaim && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClaim}
                  disabled={isActionLoading}
                  className="gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Claim Quotation
                </Button>
              )}

              {status === QUOTATION_STATUSES.CONFIRMED && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmed — Converted to Order
                </span>
              )}
            </div>

            {/* Reject reason form */}
            {showRejectForm && actions.canReject && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 space-y-3">
                <h4 className="text-xs font-semibold text-red-900">Rejection Reason (Optional)</h4>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection (e.g. price too high, insufficient justification)..."
                  className="text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReject}
                    disabled={isActionLoading}
                    className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ThumbsDown className="w-3.5 h-3.5" />
                    )}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}

            {/* Quotation Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Quotation Summary
                  </h4>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5">
                    Commercial proposal
                  </p>
                </div>
                <div className="flex flex-wrap items-baseline gap-6 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Subtotal</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(quotation.subtotal || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Discount</span>
                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(quotation.discountAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">GST (18%)</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(quotation.taxAmount || 0)}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-slate-400 block text-[11px]">Total amount</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(quotation.total || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      INR · Inclusive of applicable taxes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown & Line Items */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Pricing Breakdown
                  </h4>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    Quotation line items
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInvoiceOpen(true)}
                    className="gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Invoice</span>
                  </Button>
                  {actions.canCounterOffer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCounterForm(!showCounterForm)}
                      className="gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Counter Offer</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Counter offer drawer / form */}
              {showCounterForm && actions.canCounterOffer && (
                <div className="mb-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-blue-950">
                        Propose Counter-Offer Discount
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowCounterForm(false)}
                      className="text-xs text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={handleCounterOfferSubmit} className="mt-3 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Requested Discount (%)"
                          type="number"
                          min="1"
                          max="40"
                          value={discountPercent}
                          error={counterErrors.requestedDiscountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          helperText="Max counter-offer: 40%"
                        />
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100 flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">
                          Estimated Revised Total
                        </span>
                        <span className="text-lg font-bold text-blue-700 mt-0.5">
                          {formatCurrency(Math.round(calculatedNewTotal))}
                        </span>
                        <span className="text-[10px] text-emerald-600">
                          Saves {formatCurrency(Math.round(calculatedDiscountAmount))}
                        </span>
                      </div>
                    </div>

                    {counterWarnings.requestedDiscountPercent && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ {counterWarnings.requestedDiscountPercent}
                      </p>
                    )}

                    <Textarea
                      label="Business Justification"
                      required
                      value={counterNote}
                      error={counterErrors.message}
                      placeholder="e.g. Requesting 15% discount for bulk commitment and immediate payment approval..."
                      onChange={(e) => setCounterNote(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowCounterForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        loading={isSubmittingCounter}
                        className="gap-1.5"
                      >
                        Submit Counter-Offer
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Line items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 pr-4">Product</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 pl-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(quotation.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No line items found.
                        </td>
                      </tr>
                    ) : (
                      (quotation.items || []).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-slate-900 text-sm">
                              {item.name}
                            </div>
                            {item.subscriptionPlanName && (
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                📦 {item.subscriptionPlanName}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.line_type === "subscription"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.line_type === "subscription" ? "Subscription" : "One-time"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 font-medium">
                            {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3.5 px-3 text-emerald-600 font-medium">
                            {item.discountPercent?.toFixed(1)}%
                          </td>
                          <td className="py-3.5 pl-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Negotiation & Conversation panel */}
          <div className="lg:col-span-4 flex flex-col bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 shadow-sm h-full min-h-[460px]">
            {/* Conversation header */}
            <div className="pb-3 border-b border-slate-200/80">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CONVERSATION
              </span>
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-base font-semibold text-slate-900">Negotiation</h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {quotation.salesRep}
                </span>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 min-h-[220px] max-h-[360px] pr-1">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.isCustomer ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{msg.sender}</span>
                    <span>·</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.isCustomer
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-200/80">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Send a message...`}
                  className="w-full text-xs pl-3 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-1.5 p-1.5 text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Bottom action buttons */}
            <div className="pt-4 mt-auto border-t border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Current total</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(quotation.total || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {actions.canCounterOffer && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-1/2 text-xs"
                    onClick={() => setShowCounterForm(true)}
                  >
                    Request Changes
                  </Button>
                )}
                {actions.canConfirm && (
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleConfirm}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    )}
                    Accept Terms
                  </Button>
                )}
                {status === QUOTATION_STATUSES.CONFIRMED && (
                  <Button variant="secondary" size="sm" className="flex-1 text-xs" disabled>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Confirmed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill / Invoice View Modal */}
      <BillInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        quotation={quotation}
      />
    </div>
  );
};

export default QuotationDetailModal;
