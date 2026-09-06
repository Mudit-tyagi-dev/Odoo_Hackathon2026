/**
 * Discount Rule Service
 *
 * Fetches discount rule configuration from the backend.
 * Uses the existing shared `api` axios client (with auth token interceptor).
 *
 * GET /discount-rules/
 * Response: Array of { id, name, min_discount_pct, max_discount_pct,
 *                      requires_manager_approval, requires_finance_approval }
 */

import api from './api'

/**
 * Fetch all discount rules from the backend.
 * @returns {Promise<Array>} Array of raw discount rule objects
 */
async function getDiscountRules() {
  const response = await api.get('/discount-rules/')
  // API returns a plain array
  return Array.isArray(response.data) ? response.data : []
}

/**
 * Derive the "Approval required" display label from boolean flags.
 * @param {boolean} requiresManager
 * @param {boolean} requiresFinance
 * @returns {string}
 */
function deriveApprovalLabel(requiresManager, requiresFinance) {
  if (requiresManager && requiresFinance) return 'Manager + Finance'
  if (requiresManager) return 'Manager'
  if (requiresFinance) return 'Finance'
  return 'None'
}

/**
 * Map a raw API discount rule to the table row format expected by DataTable.
 * Columns: ['Customer tier', 'Product category', 'Maximum discount', 'Approval required', 'Status']
 *
 * Notes:
 * - 'Product category' is not provided by the API; rendered as 'N/A' (not invented).
 * - 'Status' is a frontend-only display value (Active) since the API does not provide it.
 *
 * @param {Object} rule Raw API object
 * @returns {string[]} Row cells
 */
function mapRuleToRow(rule) {
  const maxDiscount = typeof rule.max_discount_pct === 'number'
    ? `${(rule.max_discount_pct * 100).toFixed(0)}%`
    : 'N/A'

  const approval = deriveApprovalLabel(
    rule.requires_manager_approval,
    rule.requires_finance_approval
  )

  // 'Status' is a frontend-only display value � not sourced from the API.
  const frontendStatus = 'Active'

  return [
    rule.name || 'N/A',         // Customer tier
    'N/A',                      // Product category � API does not provide this field
    maxDiscount,                // Maximum discount (max_discount_pct * 100)%
    approval,                   // Approval required (derived from boolean flags)
    frontendStatus,             // Status (frontend display only)
  ]
}

const discountRuleService = {
  getDiscountRules,
  deriveApprovalLabel,
  mapRuleToRow,
}

export default discountRuleService
