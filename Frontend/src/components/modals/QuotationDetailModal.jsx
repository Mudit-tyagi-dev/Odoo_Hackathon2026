import React, { useState } from "react";
import {
  X,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { validateCounterOffer } from "../../utils/validation";
import { useToast } from "../ui/Toast";

export const QuotationDetailModal = ({
  isOpen,
  onClose,
  quotation,
  onUpdateQuotation,
}) => {
  const toast = useToast();
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("15");
  const [counterNote, setCounterNote] = useState("");
  const [counterErrors, setCounterErrors] = useState({});
  const [counterWarnings, setCounterWarnings] = useState({});
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState("");
  const [conversation, setConversation] = useState(quotation?.conversation || []);

  if (!isOpen || !quotation) return null;

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
      sender: "You",
      senderRole: "Acme Corporation",
      avatarText: "RK",
      isCustomer: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message: chatInput.trim(),
    };

    setConversation((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const handleCounterOfferSubmit = (e) => {
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

    setTimeout(() => {
      setIsSubmittingCounter(false);
      setShowCounterForm(false);

      // Add system/chat message for the offer
      const offerMsg = {
        id: "msg-" + Date.now(),
        sender: "You",
        senderRole: "Acme Corporation",
        avatarText: "RK",
        isCustomer: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        message: `Submitted counter-offer requesting ${discountPercent}% discount (Proposed total: ₹${Math.round(
          calculatedNewTotal
        ).toLocaleString("en-IN")}). Note: ${counterNote}`,
      };

      setConversation((prev) => [...prev, offerMsg]);

      // Update parent state
      if (onUpdateQuotation) {
        onUpdateQuotation({
          ...quotation,
          status: "Awaiting Approval",
          lastUpdated: "Just now",
          conversation: [...conversation, offerMsg],
        });
      }

      toast.success(
        `Counter-offer of ${discountPercent}% submitted to ${quotation.salesRep}. Status moved to 'Awaiting Approval'.`,
        "Counter-Offer Sent"
      );
    }, 800);
  };

  const handleAcceptQuotation = () => {
    if (quotation.status === "Confirmed") {
      toast.info("This quotation has already been confirmed into an order.");
      return;
    }

    toast.success(
      `Quotation ${quotation.id} confirmed! Generating Sales Order SO-2026-${Math.floor(
        1000 + Math.random() * 9000
      )}.`,
      "Quotation Confirmed"
    );

    if (onUpdateQuotation) {
      onUpdateQuotation({
        ...quotation,
        status: "Confirmed",
        lastUpdated: "Just now",
      });
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
            <span>My quotations</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">{quotation.id}</span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                <Badge variant={quotation.status}>{quotation.status}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                {quotation.id}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-xs text-slate-500">
                <p>
                  Acme Corporation · Prepared by{" "}
                  <strong className="text-slate-700">{quotation.salesRep}</strong>
                </p>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Created: <strong className="text-slate-600">{quotation.date}</strong></span>
                  <span>Valid until: <strong className="text-slate-600">{quotation.validUntil}</strong></span>
                </div>
              </div>
            </div>

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
                      ₹{quotation.subtotal?.toLocaleString("en-IN") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Discount</span>
                    <span className="font-semibold text-emerald-600">
                      -₹{quotation.discountAmount?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tax (18%)</span>
                    <span className="font-semibold text-slate-800">
                      ₹{quotation.taxAmount?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-slate-400 block text-[11px]">Total amount</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{quotation.total?.toLocaleString("en-IN")}
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
                {quotation.status !== "Confirmed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCounterForm(!showCounterForm)}
                    className="gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Make a counter offer</span>
                  </Button>
                )}
              </div>

              {/* Counter offer drawer / form */}
              {showCounterForm && (
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
                          ₹{Math.round(calculatedNewTotal).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-emerald-600">
                          Saves ₹{Math.round(calculatedDiscountAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {counterWarnings.requestedDiscountPercent && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ {counterWarnings.requestedDiscountPercent}
                      </p>
                    )}

                    <Textarea
                      label="Business Justification (Heavy Checking)"
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
                      <th className="py-2.5 pr-4">One-Time Products</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(quotation.items || []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {item.name}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {item.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 font-medium">
                          {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700">
                          ₹{item.unitPrice?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-emerald-600 font-medium">
                          {item.discountPercent}%
                        </td>
                        <td className="py-3.5 pl-3 text-right font-semibold text-slate-900">
                          ₹{item.total?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
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
                  {quotation.salesRep} is online
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
                  placeholder={`Reply to ${quotation.salesRep}...`}
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
                  ₹{quotation.total?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-1/2 text-xs"
                  onClick={() => setShowCounterForm(true)}
                >
                  Request changes
                </Button>
                <Button
                  variant={quotation.status === "Confirmed" ? "secondary" : "primary"}
                  size="sm"
                  className="w-1/2 text-xs"
                  onClick={handleAcceptQuotation}
                >
                  {quotation.status === "Confirmed" ? "Confirmed" : "Accept Terms"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetailModal;
