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
 */
export async function createQuotation(data) {
  const payload = {
    customer_id: data.customer_id ? Number(data.customer_id) : null,
    lines: (data.lines || []).map((line) => ({
      product_id: Number(line.product_id),
      quantity: Math.max(1, Number(line.quantity) || 1),
      unit_price: Math.max(0, Number(line.unit_price) || 0),
      discount_pct: Math.min(100, Math.max(0, Number(line.discount_pct) || 0)),
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
 * Helper to adapt raw API quotation response into UI model format.
 */
export function normalizeQuotation(q, productsMap = {}, plansMap = {}) {
  if (!q) return null;

  const lines = q.lines || [];
  let subtotal = 0;

  const items = lines.map((l, idx) => {
    const qty = Number(l.quantity) || 1;
    const price = parseFloat(l.unit_price) || 0;
    const disc = parseFloat(l.discount_pct) || 0;
    const lineNet = qty * price * (1 - disc / 100);
    subtotal += lineNet;

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
      discountPercent: disc,
      discount: disc,
      line_type: l.line_type || LINE_TYPES.ONE_TIME,
      subscription_plan_id: l.subscription_plan_id,
      subscriptionPlanName: plan.product?.name ? `${plan.product.name} (${plan.billing_cycle})` : `Plan #${l.subscription_plan_id}`,
      billingCycle: plan.billing_cycle || 'monthly',
      total: lineNet,
    };
  });

  const taxAmount = subtotal * 0.18;
  const grandTotal = subtotal + taxAmount;

  const createdDate = q.created_at
    ? new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recently';

  return {
    id: `QT-2026-${String(q.id).padStart(4, '0')}`,
    rawId: q.id,
    quote: `QT-2026-${String(q.id).padStart(4, '0')}`,
    customer_id: q.customer_id,
    customer: `Customer #${q.customer_id || 1}`,
    salesRep: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'Jordan Lee',
    salesRepRole: 'Senior Account Executive',
    date: createdDate,
    validUntil: '30 Sep 2026',
    status: q.status || 'draft',
    stage: formatQuotationStatus(q.status || 'draft'),
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    total: Math.round(grandTotal),
    amount: Math.round(grandTotal),
    discount: `${lines.length > 0 ? (lines.reduce((acc, l) => acc + parseFloat(l.discount_pct || 0), 0) / lines.length).toFixed(0) : 0}%`,
    risk: parseFloat(q.blended_risk_score || 0) > 20 ? 'High' : 'Low',
    lineItemsCount: lines.length,
    items,
    lines: q.lines || [],
    conversation: [
      {
        id: 'msg-init',
        sender: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'Jordan Lee',
        senderRole: 'Account Executive',
        isCustomer: false,
        time: createdDate,
        message: `Quotation created and submitted for Customer #${q.customer_id}.`,
      },
    ],
    lastUpdated: 'Just now',
    owner: q.sales_rep_id ? `Sales Rep #${q.sales_rep_id}` : 'Jordan Lee',
    updated: createdDate,
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
  normalizeQuotation,
};

export default quotationService;
