# DealFlow360 — Customer Portal Frontend

> A premium, responsive, customer-facing B2B portal for the **DealFlow360** sales platform, built with **React (Vite)**, **Tailwind CSS v4**, Shadcn UI-style components, and a custom enterprise validation engine.

---

## 🗂️ Project Structure

```
Frontend/
├── public/
└── src/
    ├── components/
    │   ├── layout/
    │   │   ├── Header.jsx           # Sticky top bar — search, notifications, profile
    │   │   └── Sidebar.jsx          # Desktop sidebar + mobile slide-in drawer
    │   ├── modals/
    │   │   ├── CommandMenu.jsx      # ⌘K global command palette
    │   │   ├── DeleteQuotationModal.jsx  # 5-layer governance cancellation modal
    │   │   └── QuotationDetailModal.jsx  # Pricing + negotiation chat workspace
    │   └── ui/
    │       ├── Badge.jsx            # Status pill with dot indicator
    │       ├── Button.jsx           # Multi-variant button with loading state
    │       ├── Card.jsx             # Card family components
    │       ├── Input.jsx            # Labelled input with error display
    │       ├── Modal.jsx            # Accessible dialog component
    │       ├── Textarea.jsx         # Textarea with char counter & error state
    │       └── Toast.jsx            # Toast provider + useToast() hook
    ├── pages/
    │   ├── Account.jsx              # Profile & GSTIN/Address form with validation
    │   ├── Billing.jsx              # Financial KPIs and invoice table
    │   ├── Dashboard.jsx            # KPI cards, recent quotations, activity feed
    │   ├── Orders.jsx               # Confirmed orders with fulfillment tracking
    │   └── Quotations.jsx           # Searchable quotations table
    ├── routes/
    │   └── AppRoutes.jsx            # Route definitions
    ├── services/
    │   ├── api.js                   # Axios client with JWT interceptor
    │   └── mockData.js              # ⚠️ Replace with real API when backend is ready
    ├── utils/
    │   ├── errorHandler.js          # API & form error parser
    │   └── validation.js            # Enterprise custom validation engine
    ├── App.jsx                      # Root component — state, layout, modals
    ├── index.css                    # Tailwind v4 base + global styles
    └── main.jsx                     # React root entry
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>=18`
- npm `>=9`

### Installation

```bash
cd Frontend
npm install
```

### Development Server

```bash
npm run dev
# App available at http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/
```

---

## 🌐 Portal Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Welcome banner, KPI cards, recent quotations & activity |
| `→ My Quotations` | Quotations | Searchable/filterable quotations table |
| `→ Orders` | Orders | Confirmed orders with fulfillment stage |
| `→ Billing` | Billing | Invoices, outstanding balance, recurring charges |
| `→ Account` | Account | Company profile, GSTIN, billing address management |

---

## 🛡️ Custom Validation Engine

All validation logic lives in [`src/utils/validation.js`](src/utils/validation.js).

### PO / Quotation Cancellation (5-Layer Check)

| Layer | Rule |
|-------|------|
| 1 | **Status Guard** — blocks `Confirmed`, `Paid`, `In Fulfillment` with governance block message |
| 2 | **Reason Category** — must select a valid predefined category |
| 3 | **Justification** — minimum 15 characters, max 500 chars, anti-spam check |
| 4 | **Exact ID Match** — must type the quotation ID (e.g. `Q-2026-0042`) or `DELETE` |
| 5 | **Legal Acknowledgement** — mandatory checkbox confirming action is irreversible |

### Counter-Offer Validation

| Rule | Constraint |
|------|-----------|
| Discount % | 1% – 40% range (soft warning > 25% for VP approval) |
| Proposed Amount | Must be lower than current quotation total |
| Justification | Minimum 15 characters required |

### Account Profile & Tax (Heavy Format Checking)

| Field | Validation |
|-------|-----------|
| GSTIN | 15-char Indian format regex (`22AAAAA0000A1Z5`) |
| Phone | E.164 / Indian 10-digit (`+91 98765 43210`) |
| Email | RFC 5322 corporate email format |
| Postal PIN | 6-digit Indian PIN code |

---

## 🔔 Toast Notification System

The `useToast()` hook is available globally via `<ToastProvider>`:

```js
const toast = useToast();

toast.success("Quotation Q-2026-0042 cancelled successfully.");
toast.error("Blocked: Confirmed orders cannot be deleted.", "Governance Error");
toast.warning("Discount above 25% requires VP approval.");
toast.info("Invoice INV-2026-1042 downloaded successfully.");
```

---

## 📱 Responsiveness

| Screen | Behaviour |
|--------|-----------|
| `< 1024px` (Mobile / Tablet) | Sidebar hidden; hamburger menu triggers slide-in drawer |
| `768px – 1024px` (Tablet) | 2-column KPI grid, horizontal table scroll |
| `> 1024px` (Desktop) | Fixed sidebar + full layout |

---

## 🔌 Connecting to the Real Backend

All mock data is in `src/services/mockData.js`. To wire the real API:

1. **Auth** — update `VITE_API_URL` in `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```

2. **API calls** — the Axios client at `src/services/api.js` already handles JWT Bearer tokens from `localStorage`. Replace each mock return with the correct API endpoint per `docs/DealFlow360_Customer_Portal_API_Responsibility.md`:

| Action | Endpoint |
|--------|---------|
| Get quotations | `GET /api/customer/quotations` |
| Get single quotation | `GET /api/customer/quotations/:id` |
| Submit counter offer | `POST /api/customer/quotations/:id/counter-offer` |
| Confirm quotation | `POST /api/customer/quotations/:id/confirm` |
| Cancel quotation | `DELETE /api/customer/quotations/:id` or `POST /api/customer/quotations/:id/cancel` |
| Get orders | `GET /api/customer/orders` |
| Get invoices | `GET /api/customer/orders/:id/invoices` |
| Login | `POST /api/customer/auth/login` |
| Verify magic link | `POST /api/customer/auth/verify` |

3. **Remove `setTimeout` mocks** in `DeleteQuotationModal.jsx` and `QuotationDetailModal.jsx` and replace with real `api.post()` calls.

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client with JWT interceptor |
| `tailwindcss` v4 | Utility-first CSS |
| `@tailwindcss/vite` | Tailwind Vite plugin |
| `lucide-react` | Premium icon library |
| `clsx` + `tailwind-merge` | Conditional class merging (Shadcn pattern) |

---

## 📁 Related Documentation

- [`docs/ui_flow.md`](../docs/ui_flow.md) — Complete UI specification and page flows
- [`docs/DealFlow360_Customer_Portal_API_Responsibility.md`](../docs/DealFlow360_Customer_Portal_API_Responsibility.md) — API contract and integration responsibilities

---

## ⚠️ Important Notes

- **Mock Data** (`src/services/mockData.js`) is the single source of truth during development. When the backend is ready, replace data-fetching functions one page at a time.
- **`allow_origins=["*"]`** is present in `backend/app/main.py`. **This must be restricted to specific origins before any staging or production deployment.**
- The portal does **not** expose internal admin, sales rep, or warehouse routes. All internal tooling is out of scope per the API responsibility document.

---

*Built for the Odoo Hackathon 2026 · DealFlow360 Team*
