// Deal pipeline & opportunity mock data (Preserved exclusively for Sales Workspace)
export const stageData = [
  { label: 'Draft', count: 8, amount: '₹214K', tone: 'muted' },
  { label: 'Approval', count: 4, amount: '₹386K', tone: 'amber' },
  { label: 'Negotiation', count: 6, amount: '₹512K', tone: 'blue' },
  { label: 'Fulfillment', count: 3, amount: '₹194K', tone: 'violet' },
  { label: 'Completed', count: 12, amount: '₹1.08M', tone: 'green' },
]

export const deals = [
  { quote: 'QT-2048', customer: 'Apex Manufacturing', amount: '₹1,28,400', stage: 'Approval', discount: '18%', risk: 'High', activity: '12 min ago', owner: 'Jordan Lee', issue: 'Approval pending' },
  { quote: 'QT-2043', customer: 'Northwind Logistics', amount: '₹82,000', stage: 'Negotiation', discount: '10%', risk: 'Low', activity: 'Today, 9:42 AM', owner: 'Maya Chen', issue: 'Stalled deal' },
  { quote: 'QT-2039', customer: 'Vertex Systems', amount: '₹54,600', stage: 'Fulfillment', discount: '8%', risk: 'Low', activity: 'Yesterday', owner: 'Sam Rivera', issue: 'Delivery issue' },
  { quote: 'QT-2035', customer: 'BluePeak Energy', amount: '₹32,800', stage: 'Draft', discount: '16%', risk: 'Medium', activity: '2 days ago', owner: 'Jordan Lee', issue: 'High-risk discount' },
  { quote: 'QT-2028', customer: 'Cobalt Health', amount: '₹2,16,000', stage: 'Completed', discount: '12%', risk: 'Low', activity: 'Mar 18', owner: 'Maya Chen', issue: 'Billing issue' },
]

export const quotationRows = deals.map((deal, index) => ({
  ...deal,
  updated: ['2 min ago', 'Today', 'Yesterday', 'Mar 20', 'Mar 18'][index],
  salesRep: deal.owner,
  category: ['Hardware', 'Services', 'Subscriptions', 'Hardware', 'Services'][index],
}))

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
}
