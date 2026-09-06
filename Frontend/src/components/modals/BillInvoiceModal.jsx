import React, { useMemo } from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Calendar, User, Building, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import taxService from '../../services/taxService';
import { formatQuotationStatus, formatLineType } from '../../services/quotationService';

export function BillInvoiceModal({ isOpen, onClose, quotation, customerUser }) {
  if (!isOpen || !quotation) return null;

  // Extract items
  const items = quotation.items || quotation.lines || [];

  // Compute tax and totals using centralized taxService
  const totals = useMemo(() => {
    const linesForTax = items.map((item) => ({
      quantity: item.quantity || item.qty || 1,
      unit_price: item.price || item.unitPrice || item.unit_price || 0,
      discount_pct: item.discount || item.discountPercent || item.discount_pct || 0,
    }));
    return taxService.calculateQuotationTotals(linesForTax);
  }, [items]);

  const customerName =
    quotation.customer ||
    quotation.customerOrg?.name ||
    customerUser?.company ||
    customerUser?.customerOrg?.name ||
    customerUser?.name ||
    'Acme Manufacturing Co.';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:static">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:w-full">
        {/* Modal Top Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Tax Invoice & Commercial Bill
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / Download PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* Header Branding & Invoice Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  DF
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  DealFlow<span className="text-blue-600">360</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Enterprise Commercial Platform</p>
              <p className="text-xs text-slate-500">GSTIN: 24AAACD1234F1Z9 · HSN/SAC Billing</p>
            </div>

            <div className="text-right sm:text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-semibold text-xs mb-1">
                COMMERCIAL INVOICE
              </span>
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {quotation.id || quotation.quote || 'QT-2026-0000'}
              </h1>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <p>Date: <strong className="text-slate-700">{quotation.date || '06 Sep 2026'}</strong></p>
                <p>Valid Until: <strong className="text-slate-700">{quotation.validUntil || '30 Sep 2026'}</strong></p>
                <p className="flex items-center justify-end gap-1.5 pt-1">
                  <span>Status:</span>
                  <Badge variant={quotation.status || 'draft'}>
                    {formatQuotationStatus(quotation.status)}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Representative Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Customer Billed To
              </h3>
              <p className="font-semibold text-sm text-slate-900">{customerName}</p>
              <p className="text-xs text-slate-600 mt-0.5">Enterprise Account</p>
              <p className="text-xs text-slate-500">Currency: INR (₹)</p>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Sales & Account Representative
              </h3>
              <p className="font-semibold text-sm text-slate-900">{quotation.salesRep || 'Sales Team'}</p>
              <p className="text-xs text-slate-600 mt-0.5">{quotation.salesRepRole || 'Account Executive'}</p>
              <p className="text-xs text-slate-500">Commercial Terms: Net-30</p>
            </div>
          </div>

          {/* Itemized Products & Services Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Itemized Products & Subscriptions
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Unit Price</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        No quotation line items available.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qty = item.quantity || item.qty || 1;
                      const price = item.price || item.unitPrice || item.unit_price || 0;
                      const discount = item.discount || item.discountPercent || item.discount_pct || 0;
                      const isSub =
                        item.line_type === 'subscription' ||
                        item.category === 'Subscriptions' ||
                        item.subscription_plan_id ||
                        item.billingCycle;
                      const lineRaw = qty * price;
                      const lineDisc = (lineRaw * discount) / 100;
                      const lineNet = lineRaw - lineDisc;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-sm">
                              {item.product || item.name || 'Product Item'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.description || item.category || 'Standard Product'}
                            </div>

                            {/* Detailed Subscription Info Breakdown */}
                            {isSub && (
                              <div className="mt-1.5 p-2 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 flex flex-wrap items-center gap-3">
                                <span className="font-semibold">
                                  Plan: {item.subscriptionPlanName || item.planName || 'Recurring Plan'}
                                </span>
                                <span>·</span>
                                <span>
                                  Billing Cycle: {item.billingCycle || item.billing_cycle || 'Monthly'}
                                </span>
                                <span>·</span>
                                <span>
                                  Recurring Rate: {formatCurrency(price)} / {item.billingCycle || 'mo'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isSub
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isSub ? 'Subscription' : 'One-Time'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-800">{qty}</td>
                          <td className="py-3.5 px-3 text-slate-700">{formatCurrency(price)}</td>
                          <td className="py-3.5 px-3 text-emerald-600 font-medium">{discount}%</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                            {formatCurrency(lineNet)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Tax Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="max-w-xs text-xs text-slate-500 space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Tax Configuration Applied
                </p>
                <p className="text-[11px] text-slate-600">
                  {totals.taxName} · Calculated strictly using active frontend tax configuration module.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-80 bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Total</span>
                  <span className="font-medium">- {formatCurrency(totals.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Net Subtotal (Pre-Tax)</span>
                <span className="font-medium text-slate-900">{formatCurrency(totals.netSubtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Applicable GST ({totals.taxRate}%)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.taxAmount)}</span>
              </div>

              {quotation.shipping > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Logistics & Freight</span>
                  <span className="font-medium text-slate-900">{formatCurrency(quotation.shipping)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline border-t border-slate-300 pt-3 text-sm font-bold text-slate-900">
                <span>Grand Total (INR)</span>
                <span className="text-base text-blue-600">
                  {formatCurrency(totals.grandTotal + (quotation.shipping || 0))}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 text-right">
                All prices in INR (₹) · Inclusive of taxes
              </p>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
            Thank you for choosing DealFlow360. If you have questions regarding this commercial bill, contact your Account Executive.
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillInvoiceModal;
