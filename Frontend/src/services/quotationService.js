import api from './api';

export const QUOTATION_STATUSES = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEGOTIATING: 'negotiating',
  CONFIRMED: 'confirmed',
};

export const QUOTATION_STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
};

export const LINE_TYPES = {
  ONE_TIME: 'one_time',
  SUBSCRIPTION: 'subscription',
};

export const LINE_TYPE_LABELS = {
  one_time: 'One-time',
  subscription: 'Subscription',
};

/**
 * Format status key into human-readable text.
 */
export function formatQuotationStatus(status) {
  if (!status) return 'Draft';
  return QUOTATION_STATUS_LABELS[status] || status;
}

/**
 * Format line type key into human-readable text.
 */
export function formatLineType(lineType) {
  if (!lineType) return 'One-time';
  return LINE_TYPE_LABELS[lineType] || lineType;
}

/**
 * List quotations from backend GET /quotations.
 * @param {{ offset?: number, limit?: number }} params
 * @returns {Promise<Array>}
 */
export async function getQuotations({ offset = 0, limit = 100 } = {}) {
  const response = await api.get('/quotations', {
    params: { offset, limit },
  });
  const data = response.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

/**
 * Create a new quotation via POST /quotations.
 * NOTE: Backend expects discount_pct as 0-1 fraction (e.g. 0.1 for 10%)
 */
export async function createQuotation(data) {
  const payload = {
    customer_id: data.customer_id ? Number(data.customer_id) : null,
    lines: (data.lines || []).map((line) => ({
      product_id: Number(line.product_id),
      quantity: Math.max(1, Number(line.quantity) || 1),
      unit_price: Math.max(0, Number(line.unit_price) || 0),
      // API expects 0-1 fraction; UI stores 0-100 percent → divide by 100
      discount_pct: Math.min(1, Math.max(0, (Number(line.discount_pct) || 0) / 100)),
      line_type: line.line_type || LINE_TYPES.ONE_TIME,
      subscription_plan_id:
        line.line_type === LINE_TYPES.SUBSCRIPTION && line.subscription_plan_id
          ? Number(line.subscription_plan_id)
          : null,
    })),
  };

  const response = await api.post('/quotations', payload);
  return response.data;
}

/**
 * Update a quotation via PATCH /quotations/{quotation_id}.
 * Used for counter-offer / editing lines.
 * NOTE: Backend expects discount_pct as 0-1 fraction.
 */
export async function updateQuotation(quotationId, data) {
  const payload = {
    lines: (data.lines || []).map((line) => ({
      product_id: Number(line.product_id),
      quantity: Math.max(1, Number(line.quantity) || 1),
      unit_price: Math.max(0, Number(line.unit_price) || 0),
      discount_pct: Math.min(1, Math.max(0, (Number(line.discount_pct) || 0) / 100)),
      line_type: line.line_type || LINE_TYPES.ONE_TIME,
      subscription_plan_id:
        line.line_type === LINE_TYPES.SUBSCRIPTION && line.subscription_plan_id
          ? Number(line.subscription_plan_id)
          : null,
    })),
  };

  const response = await api.patch(`/quotations/${quotationId}`, payload);
  return response.data;
}

/**
 * Submit a quotation for approval via POST /quotations/{id}/submit
 */
export async function submitQuotation(quotationId) {
  const response = await api.post(`/quotations/${quotationId}/submit`);
  return response.data;
}

/**
 * Approve a quotation via POST /quotations/{id}/approve
 */
export async function approveQuotation(quotationId) {
  const response = await api.post(`/quotations/${quotationId}/approve`);
  return response.data;
}

/**
 * Reject a quotation via POST /quotations/{id}/reject
 */
export async function rejectQuotation(quotationId, reason = '') {
  const response = await api.post(`/quotations/${quotationId}/reject`, null, {
    params: reason ? { reason } : {},
  });
  return response.data;
}

/**
 * Confirm a quotation (customer acceptance) via POST /quotations/{id}/confirm
 */
export async function confirmQuotation(quotationId) {
  const response = await api.post(`/quotations/${quotationId}/confirm`);
  return response.data;
}

/**
 * Claim a quotation (sales rep claims) via POST /quotations/{id}/claim
 */
export async function claimQuotation(quotationId) {
  const response = await api.post(`/quotations/${quotationId}/claim`);
  return response.data;
}

/**
 * Helper to adapt raw API quotation response into UI model format.
 * NOTE: API returns discount_pct as 0-1 fraction — convert to 0-100 for display.
 */
export function normalizeQuotation(q, productsMap = {}, plansMap = {}) {
  if (!q) return null;

  const lines = q.lines || [];
  let subtotal = 0;
  let totalDiscount = 0;

  const items = lines.map((l, idx) => {
    const qty = Number(l.quantity) || 1;
    const price = parseFloat(l.unit_price) || 0;
    // API stores discount_pct as 0-1 fraction → convert to 0-100 for display
    const discFraction = parseFloat(l.discount_pct) || 0;
    const discPercent = discFraction * 100; // 0-100 for display
    const lineGross = qty * price;
    const lineDiscount = lineGross * discFraction;
    const lineNet = lineGross - lineDiscount;
    subtotal += lineGross;
    totalDiscount += lineDiscount;

    const prod = productsMap[l.product_id] || {};
    const plan = plansMap[l.subscription_plan_id] || {};

    return {
      id: l.id || `line-${idx}`,
      product_id: l.product_id,
      product: prod.name || `Product #${l.product_id}`,
      name: prod.name || `Product #${l.product_id}`,
      quantity: qty,
      unitPrice: price,
      price: price,
      // Display as 0-100 percent
      discountPercent: parseFloat(discPercent.toFixed(2)),
      discount: parseFloat(discPercent.toFixed(2)),
      // Store raw 0-1 fraction for backend operations
      discount_pct_fraction: discFraction,
      line_type: l.line_type || LINE_TYPES.ONE_TIME,
      subscription_plan_id: l.subscription_plan_id,
      subscriptionPlanName:
        plan.product?.name
          ? `${plan.product.name} (${plan.billing_cycle})`
          : l.subscription_plan_id
          ? `Plan #${l.subscription_plan_id}`
          : null,
      billingCycle: plan.billing_cycle || 'monthly',
      total: parseFloat(lineNet.toFixed(2)),
      lineTotal: parseFloat(lineNet.toFixed(2)),
    };
  });

  const netSubtotal = subtotal - totalDiscount;
  const taxRate = 0.18;
  const taxAmount = netSubtotal * taxRate;
  const grandTotal = netSubtotal + taxAmount;

  const createdDate = q.created_at
    ? new Date(q.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const updatedDate = q.updated_at
    ? new Date(q.updated_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : createdDate;

  return {
    id: `QT-2026-${String(q.id).padStart(4, '0')}`,
    rawId: q.id,
    quote: `QT-2026-${String(q.id).padStart(4, '0')}`,
    customer_id: q.customer_id,
    customer: `Customer #${q.customer_id || 1}`,
    salesRep: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'Unassigned',
    salesRepRole: 'Account Executive',
    date: createdDate,
    validUntil: '30 Sep 2026',
    status: q.status || 'draft',
    stage: formatQuotationStatus(q.status || 'draft'),
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(totalDiscount),
    netSubtotal: Math.round(netSubtotal),
    taxAmount: Math.round(taxAmount),
    total: Math.round(grandTotal),
    amount: Math.round(grandTotal),
    avgDiscountPercent: lines.length > 0
      ? parseFloat(
          (
            (lines.reduce((acc, l) => acc + (parseFloat(l.discount_pct) || 0), 0) / lines.length) *
            100
          ).toFixed(1)
        )
      : 0,
    discount: lines.length > 0
      ? `${(
          (lines.reduce((acc, l) => acc + (parseFloat(l.discount_pct) || 0), 0) / lines.length) *
          100
        ).toFixed(0)}%`
      : '0%',
    risk: parseFloat(q.blended_risk_score || 0) > 20 ? 'High' : 'Low',
    lineItemsCount: lines.length,
    items,
    lines: q.lines || [],
    conversation: [
      {
        id: 'msg-init',
        sender: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'DealFlow360 Team',
        senderRole: 'Account Executive',
        isCustomer: false,
        time: createdDate,
        message: `Quotation created for Customer #${q.customer_id}. Status: ${formatQuotationStatus(q.status)}.`,
      },
    ],
    lastUpdated: updatedDate,
    owner: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'Unassigned',
    updated: updatedDate,
  };
}

const quotationService = {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  LINE_TYPES,
  LINE_TYPE_LABELS,
  formatQuotationStatus,
  formatLineType,
  getQuotations,
  createQuotation,
  updateQuotation,
  submitQuotation,
  approveQuotation,
  rejectQuotation,
  confirmQuotation,
  claimQuotation,
  normalizeQuotation,
};

export default quotationService;
