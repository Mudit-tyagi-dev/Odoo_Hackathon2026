Build a complete, high-fidelity CUSTOMER-FACING PORTAL for a B2B sales platform called "DealFlow360".

IMPORTANT:
This is ONLY the customer side of the application. Do NOT build the internal Sales Rep, Admin, Manager, Finance, or Warehouse dashboards.

The customer portal must be a completely separate and restricted experience where a customer can securely view quotations, negotiate terms, request changes, counter discounts, communicate with the sales representative, and finally confirm a quotation.

The design should look like a polished modern B2B SaaS product suitable for a hackathon demo and real business use. Do not make it look like a basic CRUD application.

==================================================
1. CUSTOMER AUTHENTICATION
==================================================

Create:

/customer/login

Design a professional login screen for customers.

Include:
- DealFlow360 logo/name
- "Welcome back"
- Email
- Password
- Show/hide password
- Forgot password
- Sign In
- Optional "Sign in with Magic Link"

Also create:
- Loading state
- Invalid credentials state
- Successful login state

After login, redirect to Customer Dashboard.

==================================================
2. CUSTOMER LAYOUT
==================================================

Create a separate customer portal layout.

Left sidebar:

- Dashboard
- My Quotations
- Orders
- Billing
- Account

Top navigation:

- Global search
- Notifications
- Customer/company name
- Profile menu
- Logout

The customer should NEVER see internal admin/sales navigation.

Use a clean, modern enterprise design:
- White/light background
- Subtle borders
- Rounded cards
- Professional blue/purple accent
- Clear typography
- Excellent spacing
- Responsive layout
- Desktop-first but mobile friendly

==================================================
3. CUSTOMER DASHBOARD
==================================================

Create:

/customer/dashboard

Header:

"Welcome back, Acme Corporation"

Show summary cards:

- Active Quotations
- Under Negotiation
- Awaiting Approval
- Confirmed Orders

Create a "Recent Quotations" section.

Quotation cards/table should show:

- Quotation number
- Date
- Sales representative
- Total amount
- Status
- Last updated
- View button

Statuses:

- Sent
- Under Negotiation
- Pending Approval
- Confirmed
- Expired

Add a "Recent Activity" section:

Examples:
- Sales representative updated quotation
- Counter offer submitted
- Discount approved
- Quotation confirmed

Add empty states for customers with no quotations.

==================================================
4. MY QUOTATIONS
==================================================

Create:

/customer/quotations

Show all customer quotations.

Provide:

- Search
- Status filter
- Date filter
- Sort
- Pagination

Quotation list columns:

- Quotation #
- Date
- Sales Rep
- Items
- Total
- Status
- Last Updated
- Action

Also provide a card view for responsive/mobile layouts.

Clicking a quotation opens:

/customer/quotations/:id

==================================================
5. QUOTATION DETAIL — MOST IMPORTANT SCREEN
==================================================

Create a highly polished quotation detail page.

Header:

Quotation #Q-2026-0042

Customer:
Acme Corporation

Prepared by:
Sales Representative

Created:
05 Sep 2026

Valid Until:
15 Sep 2026

Status:
UNDER NEGOTIATION

Show a clear status badge.

--------------------------------------------------
QUOTATION SUMMARY
--------------------------------------------------

Display:

Subtotal
Discount
Tax
Total

Currency should be clearly visible.

Example:

Subtotal              ₹14,97,500
Discount               -₹1,47,500
Tax                      ₹90,000
--------------------------------
Total                 ₹13,40,000

==================================================
6. PRODUCT / QUOTATION LINES
==================================================

Create a professional quotation table.

Columns:

- Product
- Description
- Quantity
- Unit Price
- Discount
- Total
- Actions

Example products:

Laptop Pro
10 units
₹1,50,000
12% discount

Setup Service
1 unit
₹50,000
5% discount

Premium Support
10 units
₹5,000/month

Clearly separate:

ONE-TIME PRODUCTS

and

RECURRING PRODUCTS

Each line should have:

[Ask Question]
[Request Change]

Do NOT allow the customer to directly edit the quotation. All changes must go through negotiation/change requests.

==================================================
7. LINE-LEVEL QUESTION
==================================================

When customer clicks:

"Ask Question"

Open a modal or side drawer.

Example:

Ask about Laptop Pro

Message:

"Can you provide a better price if we increase the quantity?"

Buttons:

Cancel
Send Question

Show submitted questions inline with the relevant quotation line.

==================================================
8. REQUEST CHANGE
==================================================

Create a Request Change modal.

Allow the customer to request:

- Quantity change
- Discount change
- Product removal
- Product change
- Other

Example:

Request Change

Product:
Laptop Pro

Change Type:
Discount

Current Discount:
12%

Requested Discount:
15%

Reason:
"We are increasing the order quantity."

Buttons:

Cancel
Submit Request

After submission show:

"Change request submitted successfully."

==================================================
9. COUNTER OFFER — IMPORTANT
==================================================

Create a prominent "Make a Counter Offer" action.

This is one of the main features of the customer portal.

Example UI:

Current Discount
12%

Your Requested Discount
[ 15% ]

Reason for request
[ We are increasing our order quantity ]

Estimated New Total
₹12,75,000

Button:

[ Submit Counter Offer ]

After submission, show an approval state.

Example:

--------------------------------------------------
Approval Required
--------------------------------------------------

Your requested discount:
15%

This request requires internal approval.

✓ Request submitted
✓ Sales Manager
○ Finance

"You will be notified when the quotation is updated."

Do not make the customer think they can bypass approval.

==================================================
10. NEGOTIATION PANEL
==================================================

Create a beautiful real-time negotiation/comment panel.

Desktop:
Use a right-side drawer/panel.

Mobile:
Use a bottom sheet/full-screen conversation.

Example:

NEGOTIATION

Sales Representative
"Can we help with anything?"

Customer
"Can you increase the discount on the laptops?"

Sales Representative
"I can offer 13%."

Customer
"Could you do 15% if we increase quantity?"

Include:

- Message input
- Send button
- Timestamp
- User type indicator
- Line reference when a message belongs to a specific product

Allow messages to be associated with a quotation line.

==================================================
11. QUOTATION TIMELINE
==================================================

Create a timeline section.

Example:

✓ Quotation Created
✓ Quotation Sent
✓ Customer Viewed
✓ Negotiation Started
✓ Counter Offer Submitted
⏳ Approval Pending
○ Updated Quotation
○ Customer Confirmation
○ Order Created

Display:

- Event
- Date/time
- Actor
- Optional reason/comment

Make this visually clean and easy to understand.

==================================================
12. APPROVAL STATUS
==================================================

When a customer request is pending approval, show a dedicated status card.

Example:

Discount Approval

Requested:
15%

Current:
12%

Approval Progress:

✓ Sales Manager
Pending

Finance
Waiting

Status:
Pending Approval

Do not expose confidential internal information or internal approval comments.

Only show customer-safe information.

==================================================
13. UPDATED QUOTATION
==================================================

When an approval is completed, show:

"Quotation Updated"

Highlight what changed.

Example:

Discount
12% → 15%

Quantity
10 → 15

New Total
₹12,75,000

Use a "Changes" section so the customer can clearly understand the revised terms.

Button:

[ Review Updated Quotation ]

==================================================
14. CONFIRM QUOTATION
==================================================

At the bottom of an approved quotation, show a sticky summary/action bar.

Example:

Total:
₹12,75,000

[ Request Changes ] [ Confirm Quotation ]

When Confirm Quotation is clicked:

Show confirmation modal:

"Confirm Quotation?"

Quotation:
Q-2026-0042

Total:
₹12,75,000

Message:

"By confirming this quotation, you agree to the final terms shown above."

Checkbox:

"I agree to the quotation terms."

Buttons:

Cancel
Confirm Quotation

==================================================
15. CONFIRMATION SUCCESS
==================================================

After confirmation, create a success screen.

Example:

✓ Quotation Confirmed

Quotation Q-2026-0042

Thank you. Your quotation has been confirmed successfully.

Order Number:
SO-2026-00881

Total:
₹12,75,000

Status:
Processing

Buttons:

[ View Order ]
[ Back to Dashboard ]

==================================================
16. CUSTOMER ORDERS
==================================================

Create:

/customer/orders

Show:

- Order number
- Quotation number
- Date
- Total
- Status
- Fulfillment status

Create:

/customer/orders/:id

Show order timeline:

✓ Quotation Confirmed
✓ Order Created
✓ Processing
● Fulfillment
○ Shipped
○ Delivered

Show fulfillment information when available.

Example:

Main Warehouse
8 / 10 units

East Depot
2 / 10 units

This should make multi-warehouse fulfillment understandable to the customer without exposing internal warehouse controls.

==================================================
17. BILLING
==================================================

Create:

/customer/billing

Show invoices and billing information.

Invoice table:

- Invoice #
- Order
- Date
- Amount
- Due Date
- Status
- View

Statuses:

- Paid
- Pending
- Overdue

==================================================
18. SUBSCRIPTION / RECURRING BILLING
==================================================

If an order contains recurring products, show them separately.

Example:

ONE-TIME

Laptop Pro × 10
₹7,20,000

RECURRING

Premium Support
₹5,000 / month

Next Billing:
05 Oct 2026

Billing Schedule:

October     ₹5,000
November    ₹5,000
December    ₹5,000

Clearly distinguish recurring charges from one-time charges.

==================================================
19. ACCOUNT
==================================================

Create:

/customer/account

Show:

Company Name
Contact Person
Email
Phone
Billing Address
Shipping Address

Allow editing appropriate customer profile fields.

Do not expose internal system configuration.

==================================================
20. NOTIFICATIONS
==================================================

Create notification dropdown/page.

Examples:

"Quotation Q-2026-0042 was updated."

"Your discount request is awaiting approval."

"Sales Manager approved your requested discount."

"Quotation Q-2026-0042 is ready for confirmation."

"Order SO-2026-00881 has been created."

Use read/unread states.

==================================================
21. RESPONSIVE DESIGN
==================================================

Desktop:

Use sidebar + main content + negotiation drawer.

Tablet:

Collapse sidebar.

Mobile:

Use bottom navigation or hamburger menu.

Quotation table should become cards on mobile.

Negotiation should become a full-screen conversation.

The confirmation action should remain easy to access.

==================================================
22. STATES
==================================================

Create UI states for:

- Loading
- Empty
- Error
- Success
- Pending approval
- Rejected request
- Expired quotation
- Confirmed quotation
- No quotations
- No orders
- No invoices

Use skeleton loaders rather than blank screens.

Use professional toast notifications.

==================================================
23. IMPORTANT BUSINESS FLOW
==================================================

The complete customer flow must visually work like this:

Customer Login
        ↓
Customer Dashboard
        ↓
My Quotations
        ↓
Open Quotation
        ↓
Review Products
        ↓
Ask Question / Request Change
        ↓
Counter Discount
        ↓
Backend Approval
        ↓
Approval Pending
        ↓
Quotation Updated
        ↓
Customer Reviews Changes
        ↓
Confirm Quotation
        ↓
Order Created
        ↓
Fulfillment
        ↓
Billing

==================================================
24. DEMO FLOW
==================================================

Design the application so the following hackathon demo can be performed smoothly:

1. Customer logs in.

2. Customer opens quotation Q-2026-0042.

3. Customer reviews products and pricing.

4. Customer asks a question about a product.

5. Customer requests a larger discount.

6. Customer submits a counter offer.

7. UI immediately changes to "Pending Approval".

8. Internal team approves the request.

9. Customer refreshes/sees notification.

10. Updated quotation is displayed.

11. Customer reviews the changed terms.

12. Customer clicks Confirm Quotation.

13. Success screen displays the generated order number.

14. Customer opens the order and sees fulfillment status.

==================================================
25. DESIGN PRINCIPLES
==================================================

Make the portal feel like a premium B2B customer experience.

Prioritize:

- Clarity
- Trust
- Pricing transparency
- Easy negotiation
- Clear status
- Minimal clicks
- Professional business design

Avoid:

- Overly colorful UI
- Excessive animations
- Gaming-style UI
- Complicated navigation
- Internal/admin terminology
- Fake-looking dashboards
- Generic CRUD tables

The quotation page and negotiation experience should be the visual centerpiece of the application.

Use realistic sample data so the prototype looks complete.

IMPORTANT:
Build actual connected screens and interactions, not isolated static mockups.

All buttons should lead somewhere meaningful.
Use realistic UI states and transitions.
Use reusable components.
Keep the customer portal completely separate from the internal Sales/Admin application.