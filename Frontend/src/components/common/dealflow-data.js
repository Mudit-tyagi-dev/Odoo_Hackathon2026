// Deal pipeline & opportunity mock data (Preserved exclusively for Sales Workspace)
export const stageData = [
  { label: 'Draft', count: 8, amount: '₹214K', tone: 'muted' },
  { label: 'Approval', count: 4, amount: '₹386K', tone: 'amber' },
  { label: 'Negotiation', count: 6, amount: '₹512K', tone: 'blue' },
  { label: 'Fulfillment', count: 3, amount: '₹194K', tone: 'violet' },
  { label: 'Completed', count: 12, amount: '₹1.08M', tone: 'green' },
]

export const deals = []
export const quotationRows = []

// Configuration collection schemas (mock data rows removed; clean empty states rendered until backend APIs exist)
export const adminCollections = {
  'price-lists': {
    title: 'Price Lists',
    description: 'Manage customer-tier pricing and product overrides.',
    columns: ['Price list', 'Customer tier', 'Currency', 'Products', 'Updated'],
    rows: [],
  },
  'discount-rules': {
    title: 'Discount Rules',
    description: 'Set guardrails for customer tiers and product categories.',
    columns: ['Customer tier', 'Product category', 'Maximum discount', 'Approval required', 'Status'],
    rows: [],
  },
  'approval-chains': {
    title: 'Approval Chains',
    description: 'Design the approval path for quotes that need review.',
    columns: ['Level', 'Role', 'Threshold', 'Status'],
    rows: [],
  },
  'warehouses': {
    title: 'Warehouses',
    description: 'Configure stock locations and fulfillment weighting.',
    columns: ['Warehouse', 'Location', 'Capacity', 'Available', 'Utilization'],
    rows: [],
  },
  'subscription-plans': {
    title: 'Subscription Plans',
    description: 'Configure recurring plans, proration, and cancellation rules.',
    columns: ['Plan name', 'Billing frequency', 'Products', 'Proration', 'Cancellation'],
    rows: [],
  },
  'upsell-rules': {
    title: 'Upsell Rules',
    description: 'Recommend complementary products while protecting margin.',
    columns: ['Product pairing', 'Recommended product', 'Promotion', 'Minimum margin'],
    rows: [],
  },
  'tax-rules': {
    title: 'Tax / GST Configuration',
    description: 'Manage Goods & Services Tax (GST) rates, category applicability, and active status.',
    columns: ['Tax Rule Name', 'Code', 'GST Rate (%)', 'Applicable Category', 'Status', 'Actions'],
    rows: [],
  },
}
