import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, ArrowRight, ShieldCheck, Sparkles, Loader2, FileText, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import productService from '../../services/productService';
import subscriptionService from '../../services/subscriptionService';
import quotationService, { LINE_TYPES } from '../../services/quotationService';
import discountRuleService from '../../services/discountRuleService';
import taxService from '../../services/taxService';
import { parseApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/Toast';

export function CustomerCreateQuotationModal({ isOpen, onClose, user, onQuotationCreated }) {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [maxDiscountLimit, setMaxDiscountLimit] = useState(15);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [lines, setLines] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Auto derive customer ID from user context
  const customerId = user?.customer_id || user?.id || 1;
  const customerName = user?.customerOrg?.name || user?.company || user?.name || 'Acme Corporation';

  useEffect(() => {
    if (!isOpen) return;

    async function fetchCatalog() {
      setLoadingCatalog(true);
      setSubmitError('');
      setValidationErrors({});
      try {
        const [productList, planList, ruleList] = await Promise.all([
          productService.getProducts({ limit: 100 }),
          subscriptionService.getSubscriptionPlans(),
          discountRuleService.getDiscountRules().catch(() => []),
        ]);

        setProducts(productList);
        setSubscriptionPlans(planList);

        if (Array.isArray(ruleList) && ruleList.length > 0) {
          const maxRulePct = Math.max(
            ...ruleList.map((r) => (Number(r.max_discount_pct) || 0) * 100)
          );
          if (maxRulePct > 0) setMaxDiscountLimit(maxRulePct);
        }

        // Initialize with 1 line item from real catalog
        if (productList.length > 0) {
          const firstProd = productList[0];
          const isSub = firstProd.product_type === 'subscription';
          const matchingPlan = planList.find((p) => p.product_id === firstProd.id);

          setLines([
            {
              id: 'cust-line-' + Date.now(),
              product_id: firstProd.id,
              product_name: firstProd.name,
              quantity: 1,
              unit_price: parseFloat(firstProd.base_price) || 1000,
              discount_pct: 0,
              line_type: isSub ? LINE_TYPES.SUBSCRIPTION : LINE_TYPES.ONE_TIME,
              subscription_plan_id: isSub && matchingPlan ? matchingPlan.id : null,
            },
          ]);
        }
      } catch (err) {
        setSubmitError(parseApiError(err) || 'Failed to load products for quotation creation.');
      } finally {
        setLoadingCatalog(false);
      }
    }

    fetchCatalog();
  }, [isOpen]);

  // Compute subtotal, GST tax (18%), and grand total in ₹ (INR) using taxService
  const totals = useMemo(() => {
    return taxService.calculateQuotationTotals(lines);
  }, [lines]);

  const updateLine = (id, field, value) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        const updated = { ...line, [field]: value };

        if (field === 'product_id') {
          const selProd = products.find((p) => String(p.id) === String(value));
          if (selProd) {
            updated.product_id = selProd.id;
            updated.product_name = selProd.name;
            updated.unit_price = parseFloat(selProd.base_price) || 0;

            if (selProd.product_type === 'subscription') {
              updated.line_type = LINE_TYPES.SUBSCRIPTION;
              const matchingPlan = subscriptionPlans.find((p) => p.product_id === selProd.id);
              updated.subscription_plan_id = matchingPlan ? matchingPlan.id : (subscriptionPlans[0]?.id || null);
            }
          }
        }

        if (field === 'line_type') {
          if (value === LINE_TYPES.ONE_TIME) {
            updated.subscription_plan_id = null;
          } else if (value === LINE_TYPES.SUBSCRIPTION && !updated.subscription_plan_id) {
            const matchingPlan = subscriptionPlans.find((p) => p.product_id === updated.product_id);
            updated.subscription_plan_id = matchingPlan ? matchingPlan.id : (subscriptionPlans[0]?.id || null);
          }
        }

        return updated;
      })
    );
  };

  const addLine = () => {
    const firstProd = products[0] || { id: 1, name: 'Standard Product', base_price: 1000 };
    setLines((prev) => [
      ...prev,
      {
        id: 'cust-line-' + Date.now(),
        product_id: firstProd.id,
        product_name: firstProd.name,
        quantity: 1,
        unit_price: parseFloat(firstProd.base_price) || 1000,
        discount_pct: 0,
        line_type: LINE_TYPES.ONE_TIME,
        subscription_plan_id: null,
      },
    ]);
  };

  const removeLine = (id) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const validate = () => {
    const errors = {};
    if (lines.length === 0) {
      errors.lines = 'At least one line item is required.';
    }

    lines.forEach((l, idx) => {
      if (!l.product_id) {
        errors[`line_${idx}_product`] = `Line ${idx + 1}: Select a valid product.`;
      }
      if (!l.quantity || Number(l.quantity) <= 0) {
        errors[`line_${idx}_qty`] = `Line ${idx + 1}: Quantity must be greater than 0.`;
      }
      if (l.unit_price === '' || Number(l.unit_price) < 0) {
        errors[`line_${idx}_price`] = `Line ${idx + 1}: Price must be valid.`;
      }
      if (l.discount_pct < 0 || l.discount_pct > maxDiscountLimit) {
        errors[`line_${idx}_disc`] = `Line ${idx + 1}: Discount cannot exceed applicable configured maximum (${maxDiscountLimit}%).`;
      }
      if (l.line_type === LINE_TYPES.SUBSCRIPTION && !l.subscription_plan_id) {
        errors[`line_${idx}_plan`] = `Line ${idx + 1}: Subscription plan is required for subscription lines.`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix validation errors before submitting.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        customer_id: customerId,
        lines: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          discount_pct: Number(l.discount_pct) || 0,
          line_type: l.line_type,
          subscription_plan_id: l.line_type === LINE_TYPES.SUBSCRIPTION ? Number(l.subscription_plan_id) : null,
        })),
      };

      const response = await quotationService.createQuotation(payload);

      toast.success(
        `Quotation proposal created successfully! Status: ${response.status || 'draft'}.`,
        'Quotation Created'
      );

      if (onQuotationCreated) {
        onQuotationCreated(response);
      }
      onClose();
    } catch (err) {
      const msg = parseApiError(err) || 'Failed to submit quotation to backend server.';
      setSubmitError(msg);
      toast.error(msg, 'Submission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Commercial Quotation</h2>
              <p className="text-xs text-slate-500">
                Customer: <strong className="text-slate-700">{customerName}</strong> (ID: {customerId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {Object.keys(validationErrors).length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-semibold text-amber-800">Please review the following errors:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {Object.values(validationErrors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quotation Line Items
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={addLine} disabled={loadingCatalog}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            {loadingCatalog ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse bg-slate-50 rounded-xl border">
                Loading real product catalog & subscription plans...
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line, idx) => {
                  const isSub = line.line_type === LINE_TYPES.SUBSCRIPTION;
                  const matchingPlans = subscriptionPlans.filter(
                    (p) => String(p.product_id) === String(line.product_id)
                  );
                  const availablePlans = matchingPlans.length > 0 ? matchingPlans : subscriptionPlans;

                  return (
                    <div
                      key={line.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>LINE ITEM #{idx + 1}</span>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Product selection */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 block mb-1">
                            Product
                          </label>
                          <select
                            value={line.product_id}
                            onChange={(e) => updateLine(line.id, 'product_id', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatCurrency(p.base_price)}) [{p.product_type}]
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Line type selection */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 block mb-1">
                            Line Type
                          </label>
                          <select
                            value={line.line_type}
                            onChange={(e) => updateLine(line.id, 'line_type', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500 font-semibold"
                          >
                            <option value={LINE_TYPES.ONE_TIME}>One-time</option>
                            <option value={LINE_TYPES.SUBSCRIPTION}>Subscription</option>
                          </select>
                        </div>
                      </div>

                      {/* Subscription Plan if subscription */}
                      {isSub && (
                        <div>
                          <label className="text-[11px] font-medium text-purple-900 block mb-1">
                            Subscription Plan
                          </label>
                          <select
                            value={line.subscription_plan_id || ''}
                            onChange={(e) => updateLine(line.id, 'subscription_plan_id', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-950 outline-none focus:border-purple-500 font-medium"
                          >
                            <option value="">-- Select Subscription Plan --</option>
                            {availablePlans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                Plan #{plan.id} ({plan.billing_cycle}) - {plan.product?.name || 'Product'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity, Unit Price, Discount */}
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 block mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500 text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 block mb-1">
                            Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={line.unit_price}
                            onChange={(e) => updateLine(line.id, 'unit_price', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 block mb-1">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discount_pct}
                            onChange={(e) => updateLine(line.id, 'discount_pct', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Totals Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs">
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
              <span>Applicable GST (18%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total (INR)</span>
              <span className="text-blue-600 text-base">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="gap-2">
              {isSubmitting ? (
                'Submitting POST /quotations...'
              ) : (
                <>
                  <span>Submit Quotation Proposal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerCreateQuotationModal;
