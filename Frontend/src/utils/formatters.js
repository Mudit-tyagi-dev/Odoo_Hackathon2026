/**
 * Centralized currency and number formatters for DealFlow360.
 * Default currency: Indian Rupee (₹)
 */

export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || amount === '') return '₹0';

  let num;
  if (typeof amount === 'string') {
    const trimmed = amount.trim().replace(/^[₹$€]\s?/, '');
    // Support abbreviation formats like 214K, 1.08M
    if (trimmed.endsWith('K') || trimmed.endsWith('k')) {
      const val = parseFloat(trimmed.slice(0, -1));
      return isNaN(val) ? '₹0' : `₹${val}K`;
    }
    if (trimmed.endsWith('M') || trimmed.endsWith('m')) {
      const val = parseFloat(trimmed.slice(0, -1));
      return isNaN(val) ? '₹0' : `₹${val}M`;
    }
    num = parseFloat(trimmed.replace(/,/g, ''));
  } else {
    num = Number(amount);
  }

  if (isNaN(num)) return '₹0';

  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
  } = options;

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(num);

  return `₹${formatted}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

export default formatCurrency;
