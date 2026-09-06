# DealFlow360 --- Customer Portal & Teammate API Responsibility

## Core End-to-End Flow

This document defines the integration flow between the **customer-facing
portal (Himanshu)** and the **sales/backend system (Teammate)**.

### Step 1 --- Teammate creates quotation

``` http
POST /api/quotations
```

The teammate creates the quotation in the internal sales workspace.

↓

### Step 2 --- Teammate sends quotation to customer

``` http
POST /api/quotations/:id/send
```

The quotation becomes available to the customer through the customer
portal.

↓

### Step 3 --- Himanshu's portal fetches quotation

``` http
GET /api/customer/quotations/:id
```

The customer portal retrieves the quotation details and displays them to
the customer.

↓

### Step 4 --- Customer requests an 18% discount

Himanshu's customer portal sends the customer's counter-offer:

``` http
POST /api/customer/quotations/:id/counter-offer
```

The request should contain the requested discount and any relevant
customer message/reason.

↓

### Step 5 --- Teammate's approval engine runs

The backend approval engine evaluates the requested discount:

``` text
18% requested
      ↓
Discount Rules
      ↓
Customer Tier
      ↓
Product Category
      ↓
Blended Risk
      ↓
Manager / Finance Approval
```

The customer portal does **not** decide whether the discount is
approved. That decision belongs to the backend
approval/discount-governance logic.

↓

### Step 6 --- Teammate approves

After the appropriate approval process:

``` http
POST /api/approvals/:id/approve
```

The approval result is recorded by the backend.

↓

### Step 7 --- Himanshu sees updated quotation

The customer portal fetches the latest quotation state:

``` http
GET /api/customer/quotations/:id
```

The UI should reflect the updated discount, totals, status, and approval
state returned by the backend.

↓

### Step 8 --- Customer confirms quotation

Once the customer accepts the final terms:

``` http
POST /api/customer/quotations/:id/confirm
```

↓

### Step 9 --- Backend creates order

The confirmed quotation moves into the operational flow:

``` text
Quotation
    ↓
Confirmed
    ↓
Sales Order
    ↓
Warehouse Split
    ↓
Billing
```

------------------------------------------------------------------------

# Responsibility Table

  Feature                 Himanshu / Customer Portal   Teammate / Backend
  ----------------------- ---------------------------- --------------------
  Customer Login          ✅ UI                        Backend/API
  Customer Dashboard      ✅ UI                        API
  Customer Quotations     ✅ UI                        API
  Quotation Detail        ✅ UI                        API
  Customer Comments       ✅ UI                        API
  Change Requests         ✅ UI                        API
  Counter Discount        ✅ UI                        ✅ Logic
  Approval Engine         ❌                           ✅
  Discount Rules          ❌                           ✅
  Products                ❌                           ✅
  Price Lists             ❌                           ✅
  Sales Workspace         ❌                           ✅
  Quotation Builder       ❌                           ✅
  Upsell Engine           ❌                           ✅
  Warehouse               ❌                           ✅
  Fulfillment             ❌                           ✅
  Subscription            Optional UI                  ✅ Logic
  Billing                 Optional UI                  ✅
  Customer Confirmation   ✅ UI                        API
  Orders                  ✅ UI                        ✅ Backend
  Deal Health             ❌                           ✅
  Admin Dashboard         ❌                           ✅
  Reports                 ❌                           ✅
  Audit Logs              Display                      ✅ Backend

------------------------------------------------------------------------

# API Contract Between Both Sides

The most important rule is:

> **Himanshu's frontend should consume backend APIs and should not
> duplicate business/approval logic.**

The backend should be the source of truth for quotation status,
discounts, approval state, totals, and confirmation.

## Customer Authentication

``` http
POST /api/customer/auth/login
POST /api/customer/auth/magic-link
POST /api/customer/auth/verify
POST /api/customer/auth/logout
GET  /api/customer/me
```

## Customer Quotations

``` http
GET /api/customer/quotations
GET /api/customer/quotations/:id
```

## Customer Comments

``` http
GET  /api/customer/quotations/:id/comments
POST /api/customer/quotations/:id/comments
```

## Change Requests

``` http
GET  /api/customer/quotations/:id/change-requests
POST /api/customer/quotations/:id/change-request
```

## Counter Offers

``` http
POST /api/customer/quotations/:id/counter-offer
```

## Approval Status

``` http
GET /api/customer/quotations/:id/approval-status
```

## Quotation Timeline

``` http
GET /api/customer/quotations/:id/timeline
```

## Customer Confirmation

``` http
POST /api/customer/quotations/:id/confirm
```

## Orders

``` http
GET /api/customer/orders
GET /api/customer/orders/:id
```

## Billing / Subscription

``` http
GET /api/customer/orders/:id/invoices
GET /api/customer/orders/:id/billing-schedule
```

------------------------------------------------------------------------

# Recommended Ownership

## Himanshu

Focus on the customer-facing experience:

-   Customer login
-   Customer dashboard
-   Quotation list
-   Quotation detail
-   Product/line-item display
-   Customer comments
-   Line-level questions
-   Change requests
-   Counter-offer UI
-   Negotiation UI
-   Approval-status display
-   Quotation timeline
-   Confirm quotation
-   Confirmation success screen
-   Order tracking UI
-   Optional billing/subscription UI

## Teammate

Focus on the backend and internal sales experience:

-   Customer authentication backend
-   Product management
-   Price lists
-   Discount tiers
-   Discount rules
-   Approval engine
-   Blended risk calculation
-   Approval chains
-   Sales quotation builder
-   Upsell/cross-sell engine
-   Warehouse allocation
-   Fulfillment
-   Subscription logic
-   Billing
-   Deal health
-   Admin dashboard
-   Reports
-   Audit logs
-   Sales workspace APIs

------------------------------------------------------------------------

# Critical Integration Scenario

Use this as the main hackathon demo flow.

``` text
TEammate
   │
   │ Create quotation
   ▼
POST /api/quotations
   │
   │ Send quotation
   ▼
POST /api/quotations/:id/send
   │
   ▼
CUSTOMER PORTAL
   │
   │ Fetch quotation
   ▼
GET /api/customer/quotations/:id
   │
   │ Customer requests 18% discount
   ▼
POST /api/customer/quotations/:id/counter-offer
   │
   ▼
BACKEND APPROVAL ENGINE
   │
   ├── Customer Tier
   ├── Product Category
   ├── Discount Rules
   ├── Blended Risk
   └── Approval Chain
   │
   ▼
MANAGER / FINANCE
   │
   │ Approve
   ▼
POST /api/approvals/:id/approve
   │
   ▼
CUSTOMER PORTAL
   │
   │ Fetch updated quotation
   ▼
GET /api/customer/quotations/:id
   │
   │ Customer accepts final terms
   ▼
POST /api/customer/quotations/:id/confirm
   │
   ▼
BACKEND
   │
   ├── Sales Order
   ├── Warehouse Split
   └── Billing
```

------------------------------------------------------------------------

# Important Frontend Rule

Do **not** hardcode approval behavior in the customer portal.

For example, avoid:

``` text
if discount > 15%:
    show "Manager Approval"
```

Instead, the frontend should read the backend response:

``` json
{
  "status": "UNDER_APPROVAL",
  "requestedDiscount": 18,
  "approval": {
    "required": true,
    "currentStep": "MANAGER",
    "riskLevel": "HIGH"
  }
}
```

The UI then displays the state returned by the backend.

This keeps the customer portal independent from the business rules and
allows the teammate's approval engine to control the actual decision.

------------------------------------------------------------------------

# Suggested Quotation Response Shape

Both teammates should agree on a quotation response structure before
development.

Example:

``` json
{
  "id": "QT-1001",
  "status": "UNDER_APPROVAL",
  "customer": {
    "id": "CUS-101",
    "name": "Acme Corporation"
  },
  "currency": "USD",
  "lines": [
    {
      "id": "LINE-1",
      "productId": "PROD-101",
      "name": "Enterprise Laptop",
      "category": "Hardware",
      "quantity": 2,
      "unitPrice": 1200,
      "discount": 12,
      "total": 2112
    }
  ],
  "subtotal": 2400,
  "discountTotal": 288,
  "total": 2112,
  "approval": {
    "required": true,
    "currentStep": "MANAGER",
    "riskLevel": "HIGH"
  }
}
```

The exact response shape can be adjusted by the backend team, but the
frontend and backend should agree on the contract early.

------------------------------------------------------------------------

# Hackathon Priority

For the customer-side implementation, prioritize these screens first:

1.  **Customer Login**
2.  **Customer Dashboard**
3.  **Quotation List**
4.  **Quotation Detail**
5.  **Counter Offer / Negotiation**
6.  **Approval Status**
7.  **Updated Quotation**
8.  **Confirm Quotation**
9.  **Confirmation Success**
10. **Orders**

The most important demo path is:

``` text
Login
  ↓
Quotation
  ↓
View Details
  ↓
Request 18% Discount
  ↓
Under Approval
  ↓
Approved
  ↓
Updated Quotation
  ↓
Confirm
  ↓
Order Created
```

This is the customer-side flow Himanshu should make polished and
demo-ready.
