/**
 * Centralized Tax / GST Configuration Service.
 *
 * Provides isolated frontend configuration for GST and tax calculations
 * across quotations, line items, and bill/invoice views.
 */

const DEFAULT_TAX_RULES = [
  {
    id: 'tax-gst-18',
    name: 'GST Standard (18%)',
    code: 'GST_18',
    percentage: 18,
    applicableCategory: 'all', // 'all', 'hardware', 'subscription', 'service'
    description: 'Standard Goods & Services Tax applied to commercial quotations',
    isActive: true,
  },
  {
    id: 'tax-gst-12',
    name: 'GST Reduced (12%)',
    code: 'GST_12',
    percentage: 12,
    applicableCategory: 'hardware',
    description: 'Reduced GST rate for essential hardware equipment',
    isActive: false,
  },
  {
    id: 'tax-gst-0',
    name: 'Zero Tax / Exempt (0%)',
    code: 'GST_0',
    percentage: 0,
    applicableCategory: 'all',
    description: 'Tax exemption for export / special economic zones',
    isActive: false,
  },
];

let currentTaxRules = [...DEFAULT_TAX_RULES];

/**
 * Get all configured tax rules.
 */
export function getTaxRules() {
  return [...currentTaxRules];
}

/**
 * Get the active tax rule. If multiple are active, returns the default active rule.
 */
export function getActiveTaxRule() {
  const active = currentTaxRules.find((rule) => rule.isActive);
  return active || currentTaxRules[0];
}

/**
 * Toggle tax rule active state or update rules list.
 */
export function updateTaxRules(newRules) {
  currentTaxRules = [...newRules];
  return getTaxRules();
}

/**
 * Update a single tax rule percentage or properties.
 */
export function updateTaxRule(id, updates) {
  currentTaxRules = currentTaxRules.map((rule) => {
    if (rule.id === id) {
      return { ...rule, ...updates };
    }
    return rule;
  });
  return getTaxRules();
}

/**
 * Toggle active rule ID (making it the sole active rule or active status).
 */
export function setActiveTaxRule(id) {
  currentTaxRules = currentTaxRules.map((rule) => ({
    ...rule,
    isActive: rule.id === id,
  }));
  return getTaxRules();
}

/**
 * Calculate tax for quotation lines and subtotal.
 * @param {Array} lines Array of line items with { quantity, unit_price, discount_pct }
 * @param {Object} [customTaxRule] Optional specific tax rule to apply
 */
export function calculateQuotationTotals(lines = [], customTaxRule = null) {
  const activeRule = customTaxRule || getActiveTaxRule();
  const taxRate = activeRule ? activeRule.percentage : 18;

  let subtotal = 0;
  let totalDiscount = 0;

  const processedLines = lines.map((line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const discountPct = Number(line.discount_pct) || 0;

    const lineRawSubtotal = qty * price;
    const lineDiscount = (lineRawSubtotal * discountPct) / 100;
    const lineNet = lineRawSubtotal - lineDiscount;
    const lineTax = (lineNet * taxRate) / 100;
    const lineTotal = lineNet + lineTax;

    subtotal += lineRawSubtotal;
    totalDiscount += lineDiscount;

    return {
      ...line,
      rawSubtotal: lineRawSubtotal,
      discountAmount: lineDiscount,
      netAmount: lineNet,
      taxAmount: lineTax,
      totalAmount: lineTotal,
    };
  });

  const netSubtotal = subtotal - totalDiscount;
  const totalTax = (netSubtotal * taxRate) / 100;
  const grandTotal = netSubtotal + totalTax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    netSubtotal: Math.round(netSubtotal * 100) / 100,
    taxRate,
    taxName: activeRule ? activeRule.name : 'GST (18%)',
    taxAmount: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    processedLines,
  };
}

const taxService = {
  getTaxRules,
  getActiveTaxRule,
  updateTaxRules,
  updateTaxRule,
  setActiveTaxRule,
  calculateQuotationTotals,
};

export default taxService;
