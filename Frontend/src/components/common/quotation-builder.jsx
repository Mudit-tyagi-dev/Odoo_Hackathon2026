'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDollarSign,
  Plus,
  Save,
  Trash2,
  Truck,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog, FormField, SectionHeader, StatusBadge, SuccessNotice } from './dealflow-ui'

const lifecycle = ['Draft', 'Pricing', 'Approval', 'Fulfillment', 'Billing', 'Completed']

const initialItems = [
  { id: 1, product: 'Edge Gateway Pro', category: 'Hardware', quantity: 12, price: 2480, discount: 18, tax: 8, margin: 34, maxStock: 10 },
  { id: 2, product: 'Fleet Monitoring', category: 'Subscriptions', quantity: 12, price: 420, discount: 10, tax: 0, margin: 52, maxStock: 999 },
]

export function QuotationBuilder({ onBack }) {
  const [items, setItems] = useState(initialItems)
  const [discount, setDiscount] = useState(18)
  const [customer, setCustomer] = useState('Apex Manufacturing')
  const [delivery, setDelivery] = useState('2026-04-24')
  const [warehouse, setWarehouse] = useState('West Coast Hub')
  const [billingFrequency, setBillingFrequency] = useState('annual')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  )
  const discountAmount = (subtotal * discount) / 100

  // Warehouse shipping calculation
  const warehouseShippingCosts = {
    'West Coast Hub': 120,
    'Central Distribution': 180,
    'East Coast Hub': 140,
  }
  const baseShipping = warehouseShippingCosts[warehouse] || 120

  // Check for split shipment: if hardware item quantity > warehouse stock
  const hardwareItem = items.find((i) => i.category === 'Hardware')
  const isSplitShipment = hardwareItem && hardwareItem.quantity > (hardwareItem.maxStock || 10)
  const splitFee = isSplitShipment ? 85 : 0
  const totalShipping = baseShipping + splitFee

  const tax = (subtotal - discountAmount) * 0.08
  const total = subtotal - discountAmount + tax + totalShipping

  const excess = Math.max(0, discount - 15)
  const risky = excess > 0 || total > 100000
  const margin = Math.max(0, 36 - excess * 1.8)

  // Deal health & win probability
  const dealHealthScore = Math.max(10, Math.min(98, Math.round(85 - excess * 2.5 + (items.length > 2 ? 8 : 0))))
  const winProbability = Math.max(20, Math.min(95, Math.round(75 - excess * 1.5 + (margin > 30 ? 10 : 0))))

  const updateItem = (id, key, value) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: Math.max(0, value) } : item))
    )

  const addItem = (customItem) => {
    const newItem = customItem || {
      id: Date.now(),
      product: 'Implementation Services',
      category: 'Services',
      quantity: 1,
      price: 9600,
      discount: 10,
      tax: 8,
      margin: 42,
      maxStock: 999,
    }
    setItems((current) => [...current, newItem])
  }

  // Check if upsell recommendation is already in quote
  const hasSupportUpsell = items.some((i) => i.product.includes('Premium Support'))

  const addSupportUpsell = () => {
    addItem({
      id: Date.now(),
      product: 'Premium Support & SLA (24/7)',
      category: 'Subscriptions',
      quantity: 1,
      price: 3600,
      discount: 10,
      tax: 0,
      margin: 60,
      maxStock: 999,
    })
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Top Header */}
      <div className="border-b bg-card px-5 py-5 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <button
              onClick={onBack}
              className="mb-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              ← Back to Sales Workspace
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Quotation Builder</h1>
              <StatusBadge value={submitted ? 'Approval pending' : 'Draft'} />
              <Badge variant="outline" className="text-xs bg-muted/40">
                QT-2048
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Commercial proposal for {customer} · Last saved just now · {saved ? 'Saved' : 'Unsaved changes'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSaved(true)
                setTimeout(() => setSaved(false), 1800)
              }}
            >
              <Save data-icon="inline-start" />
              {saved ? 'Saved' : 'Save draft'}
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={submitted}>
              <ArrowRight data-icon="inline-start" />
              {risky ? 'Route for Multi-Step Approval' : 'Confirm & Send to Customer'}
            </Button>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="mt-6 flex min-w-[720px] items-center gap-0 overflow-x-auto">
          {lifecycle.map((step, index) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`flex items-center gap-2 text-xs font-medium ${
                  index === 1 ? 'text-primary' : index < 1 ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full border ${
                    index === 1
                      ? 'border-primary bg-primary text-primary-foreground'
                      : index < 1
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background'
                  }`}
                >
                  {index < 1 ? <Check className="size-3.5" /> : index + 1}
                </span>
                {step}
              </div>
              {index < lifecycle.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="mx-auto grid max-w-[1480px] gap-6 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Card 1: Customer / Quote Info */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Customer & Commercial Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Customer"
                value={customer}
                onChange={setCustomer}
                error={!customer ? 'Customer is required.' : undefined}
              />
              <FormField label="Contact" value="Priya Nair · Procurement" onChange={() => {}} />
              <FormField label="Currency" value="USD — US Dollar" onChange={() => {}} />
              <FormField label="Price List" value="Enterprise Global (Gold Tier)" onChange={() => {}} error="" />
              <FormField
                label="Expected Delivery Date"
                value={delivery}
                onChange={setDelivery}
                type="date"
              />
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Billing Frequency</span>
                <select
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="annual">Annual Subscription (Net-30)</option>
                  <option value="monthly">Monthly Recurring</option>
                  <option value="onetime">One-Time Capital Purchase</option>
                </select>
              </label>
            </CardContent>
          </Card>

          {/* Card 2: Operations / Multi-Warehouse Allocation */}
          <Card className="shadow-none border-blue-100 bg-blue-50/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-blue-600" />
                <CardTitle className="text-base text-blue-950">Fulfillment & Multi-Warehouse Allocation</CardTitle>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                Live Inventory
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">
                    Primary Fulfillment Warehouse
                  </label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full rounded-md border bg-white px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="West Coast Hub">West Coast Hub (Oakland, CA) · 10 units in stock</option>
                    <option value="Central Distribution">Central Distribution (Dallas, TX) · 25 units in stock</option>
                    <option value="East Coast Hub">East Coast Hub (Newark, NJ) · 40 units in stock</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-medium block mb-1">
                    Fulfillment Status
                  </span>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 pt-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Allocated from {warehouse}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-medium block mb-1">
                    Shipping & Logistics Cost
                  </span>
                  <p className="text-xs font-semibold text-slate-900 pt-1.5">
                    ${totalShipping} ({isSplitShipment ? `$${baseShipping} + $${splitFee} split fee` : 'Standard freight'})
                  </p>
                </div>
              </div>

              {/* Backorder / Split Shipment Notification */}
              {isSplitShipment && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Split-Shipment Notice:</strong> {warehouse} only has 10 units in stock. 10 units will ship immediately from {warehouse}; the remaining {hardwareItem.quantity - 10} units will backorder and ship from Central Distribution (Dallas, TX).
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Products Table */}
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Products & Line Items</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hardware, services, and subscriptions in this quote.
                </p>
              </div>
              <Button size="sm" onClick={() => addItem()}>
                <Plus data-icon="inline-start" />
                Add product
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="border-y bg-muted/25 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit price</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Tax</th>
                      <th className="px-4 py-3">Margin</th>
                      <th className="px-4 py-3 text-right">Line total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category} · {item.quantity > (item.maxStock || 999) ? 'Partial backorder' : 'Available'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-16 rounded-md border bg-background px-2 py-1.5"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) => updateItem(item.id, 'quantity', Number(event.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">${item.price.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <input
                            className="w-16 rounded-md border bg-background px-2 py-1.5"
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(event) => updateItem(item.id, 'discount', Number(event.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">{item.tax}%</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">{item.margin}%</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${(item.quantity * item.price * (1 - item.discount / 100)).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${item.product}`}
                            onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Smart Upsell Recommendation Widget */}
          {!hasSupportUpsell && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                    Smart Upsell Rule Triggered
                  </h4>
                  <p className="text-xs text-purple-800 mt-0.5">
                    <strong>Rule:</strong> Hardware paired with Fleet Monitoring qualifies for <strong>Premium Support (24/7 SLA)</strong> at 10% discount. Increases blended contract margin to 44%.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addSupportUpsell}
                className="shrink-0 border-purple-300 text-purple-800 bg-white hover:bg-purple-100/60 cursor-pointer"
              >
                <Plus data-icon="inline-start" />
                Add Premium Support
              </Button>
            </div>
          )}

          {/* Card 5: Discount & Governance Guardrails */}
          <DiscountPanel discount={discount} setDiscount={setDiscount} excess={excess} risky={risky} />

          {/* Card 6: Multi-Step Approval Chain */}
          <ApprovalChainCard discount={discount} total={total} excess={excess} />
        </div>

        {/* Right Sidebar: Risk, Health & Summary */}
        <aside className="flex flex-col gap-6">
          <DealHealthPanel
            score={dealHealthScore}
            winProbability={winProbability}
            risky={risky}
            margin={margin}
            excess={excess}
          />
          <Summary
            subtotal={subtotal}
            discount={discountAmount}
            tax={tax}
            shipping={totalShipping}
            total={total}
            margin={margin}
            frequency={billingFrequency}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={risky ? 'Route quotation for multi-step approval?' : 'Confirm quotation?'}
        description={
          risky
            ? 'This quote exceeds the Gold tier discount threshold (15%) or contract value ($100k) and will be routed to Sales Manager and Finance for approval.'
            : 'The quote is within governance policy and will be moved to Confirmed status.'
        }
        onConfirm={() => setSubmitted(true)}
      />
    </main>
  )
}

function DiscountPanel({ discount, setDiscount, excess, risky }) {
  return (
    <Card className={risky ? 'border-amber-200 shadow-none' : 'shadow-none'}>
      <CardHeader>
        <CardTitle className="text-base">Discount Governance & Guardrails</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Customer tier</p>
            <p className="mt-1 font-medium">Gold</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allowed discount</p>
            <p className="mt-1 font-medium">15%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Requested discount</p>
            <input
              className="mt-1 w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(event) => setDiscount(Number(event.target.value))}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Threshold excess</p>
            <p className={`mt-1 font-semibold ${risky ? 'text-rose-700' : 'text-emerald-700'}`}>
              {excess > 0 ? `+${excess}%` : 'Within policy'}
            </p>
          </div>
        </div>
        {risky && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4 text-amber-600" />
              Discount exceeds tier limit. Multi-step approval chain automatically triggered.
            </div>
            <p className="text-xs">
              Required Approvers: Sales Manager (&gt;10%) · Finance Director (&gt;15% or &gt;$100,000)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ApprovalChainCard({ discount, total, excess }) {
  const needsManager = discount > 10
  const needsFinance = discount > 15 || total > 100000

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Approval Governance Path</CardTitle>
          <Badge variant="outline" className="text-[11px]">
            Tier: Gold
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3 bg-card">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Level 1</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                Pre-Approved
              </Badge>
            </div>
            <p className="text-sm font-semibold">Sales Representative</p>
            <p className="text-xs text-muted-foreground mt-0.5">Threshold: Standard Quotes</p>
          </div>

          <div className={`rounded-lg border p-3 ${needsManager ? 'border-amber-300 bg-amber-50/40' : 'bg-card'}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Level 2</span>
              <Badge
                variant="secondary"
                className={`text-[10px] ${needsManager ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
              >
                {needsManager ? 'Pending Review' : 'Bypassed'}
              </Badge>
            </div>
            <p className="text-sm font-semibold">Sales Manager</p>
            <p className="text-xs text-muted-foreground mt-0.5">Threshold: &gt; 10% discount</p>
          </div>

          <div className={`rounded-lg border p-3 ${needsFinance ? 'border-rose-300 bg-rose-50/40' : 'bg-card'}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Level 3</span>
              <Badge
                variant="secondary"
                className={`text-[10px] ${needsFinance ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}
              >
                {needsFinance ? 'Required' : 'Bypassed'}
              </Badge>
            </div>
            <p className="text-sm font-semibold">Finance Director</p>
            <p className="text-xs text-muted-foreground mt-0.5">Threshold: &gt; 15% or &gt; $100K</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DealHealthPanel({ score, winProbability, risky, margin, excess }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Deal Intelligence & Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-semibold tracking-tight">
              {score}
              <span className="text-lg text-muted-foreground"> / 100</span>
            </p>
            <p className={`mt-1 text-sm font-semibold ${score < 50 ? 'text-rose-700' : score < 75 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {score < 50 ? 'HIGH RISK' : score < 75 ? 'MODERATE RISK' : 'HEALTHY DEAL'}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-muted">
            <CircleDollarSign className={risky ? 'text-amber-600' : 'text-emerald-600'} />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win Probability</span>
            <span className="font-semibold text-blue-600">{winProbability}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Margin</span>
            <span className="font-medium">{margin.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount Governance</span>
            <span className="font-medium">{excess ? `+${excess}% excess` : 'Compliant'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Risk</span>
            <StatusBadge value="Low" />
          </div>
        </div>

        <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          {risky
            ? 'The requested discount reduces blended margin below the 35% target and triggers governance escalation.'
            : 'The quote is commercial policy-compliant with high close probability and healthy margin retention.'}
        </p>
      </CardContent>
    </Card>
  )
}

function Summary({ subtotal, discount, tax, shipping, total, margin, frequency }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Order Commercial Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-emerald-700 font-medium">−${discount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated Shipping</span>
          <span>${shipping.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span>${Math.round(tax).toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t pt-3 font-semibold text-base">
          <span>Grand total</span>
          <span className="text-primary">${Math.round(total).toLocaleString()}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Billing terms: {frequency === 'annual' ? 'Annual recurring billing' : frequency === 'monthly' ? 'Monthly recurring billing' : 'One-time payment on fulfillment'}
        </div>

        <div className="mt-3 rounded-md bg-muted/50 p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Blended Deal Margin</span>
            <span className="font-medium">{margin.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(margin * 2, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuotationBuilder
