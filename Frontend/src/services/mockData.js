/**
 * DealFlow360 Customer Portal Mock Data Store
 * Matches exact UI screenshots for Acme Corporation
 */

export const INITIAL_USER = {
  name: "Rohan Kapoor",
  role: "Procurement Director",
  email: "rohan.kapoor@acme-corp.com",
  phone: "+91 98200 45678",
  initials: "RK",
  customerOrg: {
    id: "cust_acme_2026",
    name: "Acme Corporation",
    shortCode: "AC",
    gstin: "27AAACA1234A1Z5",
    pan: "AAACA1234A",
    addressLine1: "Tech Park IV, 5th Floor, Tower B",
    addressLine2: "Outer Ring Road, Kadubeesanahalli",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560103",
    country: "India",
  },
};

export const INITIAL_METRICS = {
  activeQuotations: 2,
  activeQuotationsNote: "1 needs your attention",
  underNegotiation: 1,
  underNegotiationNote: "Updated 12 min ago",
  awaitingApproval: 1,
  awaitingApprovalNote: "Sales team reviewing",
  confirmedOrders: 3,
  confirmedOrdersTotalValue: "₹24,80,000 total value",
};

export const INITIAL_QUOTATIONS = [];

export const INITIAL_ORDERS = [
  {
    id: "SO-2026-00881",
    quotationId: "Q-2026-0029",
    date: "18 Aug 2026",
    itemsCount: 10,
    total: 420000,
    status: "Confirmed",
    deliveryEstimate: "22 Sep 2026",
    fulfillmentStage: "Warehouse Dispatch",
  },
  {
    id: "SO-2026-00764",
    quotationId: "Q-2026-0018",
    date: "03 Aug 2026",
    itemsCount: 5,
    total: 2060000,
    status: "Confirmed",
    deliveryEstimate: "Delivered",
    fulfillmentStage: "Delivered & Signed",
  },
];

export const INITIAL_BILLING = {
  outstandingBalance: "₹5,000",
  outstandingDueDate: "Due 05 Oct 2026",
  paidThisYear: "₹24,80,000",
  paidInvoicesCount: "Across 4 invoices",
  nextRecurringCharge: "₹5,000",
  nextRecurringDate: "05 Oct 2026",
  invoices: [
    {
      id: "INV-2026-1042",
      orderId: "SO-2026-00881",
      date: "05 Sep 2026",
      amount: 5000,
      dueDate: "05 Oct 2026",
      status: "Pending Approval",
    },
    {
      id: "INV-2026-0981",
      orderId: "SO-2026-00864",
      date: "05 Aug 2026",
      amount: 840000,
      dueDate: "Paid",
      status: "Confirmed",
    },
    {
      id: "INV-2026-0870",
      orderId: "SO-2026-00847",
      date: "05 Aug 2026",
      amount: 840000,
      dueDate: "Paid",
      status: "Confirmed",
    },
  ],
};

export const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    title: "Quotation updated",
    description: "Q-2026-0042 · Aarav Mehta",
    time: "17 min ago",
    type: "update",
  },
  {
    id: "act-2",
    title: "Counter offer submitted",
    description: "15% discount request",
    time: "24 min ago",
    type: "counter_offer",
  },
  {
    id: "act-3",
    title: "Discount approved",
    description: "Q-2026-0029 · 10% approved",
    time: "18 Aug 2026",
    type: "approval",
  },
];
