import api from './api';

/**
 * List all subscription plans.
 *
 * GET /subscription-plans returns an array of plan objects:
 * [
 *   {
 *     id: number,
 *     product_id: number,
 *     billing_cycle: "monthly" | "quarterly" | "yearly" | "weekly",
 *     product: { id, name, base_price, product_type }
 *   }
 * ]
 *
 * @returns {Promise<Array>} array of SubscriptionPlan objects
 */
export async function getSubscriptionPlans() {
  const response = await api.get('/subscription-plans');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const subscriptionService = {
  getSubscriptionPlans,
};

export default subscriptionService;