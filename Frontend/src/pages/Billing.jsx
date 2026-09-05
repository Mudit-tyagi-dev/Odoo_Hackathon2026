import React from "react";
import { CreditCard, CheckCircle2, Zap, Download, FileText, ArrowRight } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

export const Billing = ({ billingData }) => {
  const toast = useToast();

  const handleDownloadInvoice = (inv) => {
    toast.success(
      `Tax invoice ${inv.id} (₹${inv.amount.toLocaleString("en-IN")}) downloaded successfully.`,
      "Invoice Download"
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
            WORKSPACE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
            Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Invoices and recurring charges across your account
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info(
              "Billing profile: GSTIN 27AAACA1234A1Z5 · Payment terms: Net-30",
              "Billing Terms"
            )
          }
          className="self-start sm:self-center gap-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs"
        >
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          <span>Billing details</span>
        </Button>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Outstanding Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              OUTSTANDING BALANCE
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {billingData.outstandingBalance}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {billingData.outstandingDueDate}
            </div>
          </div>
        </div>

        {/* Card 2: Paid This Year */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              PAID THIS YEAR
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {billingData.paidThisYear}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {billingData.paidInvoicesCount}
            </div>
          </div>
        </div>

        {/* Card 3: Next Recurring Charge */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              NEXT RECURRING CHARGE
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {billingData.nextRecurringCharge}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {billingData.nextRecurringDate}
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Invoices</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download or view your billing documents
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-6">INVOICE</th>
                <th className="py-3.5 px-6">ORDER</th>
                <th className="py-3.5 px-6">DATE</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6">DUE DATE</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">DOCUMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billingData.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                  {/* Invoice ID */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">
                        {inv.id}
                      </span>
                    </div>
                  </td>

                  {/* Order */}
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {inv.orderId}
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-slate-500 font-medium">
                    {inv.date}
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                    ₹{inv.amount.toLocaleString("en-IN")}
                  </td>

                  {/* Due Date */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {inv.dueDate}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6">
                    <Badge variant={inv.status}>{inv.status}</Badge>
                  </td>

                  {/* Download Action */}
                  <td className="py-4 px-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="text-xs text-blue-600 hover:bg-blue-50 h-8 px-2.5"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span>Download</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Billing;
