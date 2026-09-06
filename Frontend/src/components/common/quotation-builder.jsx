'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
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
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog, FormField, SectionHeader, StatusBadge } from './dealflow-ui'
import { formatCurrency } from '../../utils/formatters'
import productService from '../../services/productService'
import subscriptionService from '../../services/subscriptionService'
import quotationService, { LINE_TYPES } from '../../services/quotationService'
import taxService from '../../services/taxService'
import { parseApiError } from '../../utils/errorHandler'
import { useToast } from '@/components/ui/Toast'

const lifecycle = ['Draft', 'Pending Approval', 'Approved', 'Confirmed']

export function QuotationBuilder({ onBack, onQuotationCreated }) {
  const toast = useToast()

  // API Data States
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)

  // Form States
  const [customer, setCustomer] = useState('Apex Manufacturing (ID: 1)')
  const [customerId, setCustomerId] = useState(1)
  const [delivery, setDelivery] = useState('2026-04-24')
  const [warehouse, setWarehouse] = useState('West Coast Hub')
  const [billingFrequency, setBillingFrequency] = useState('annual')
  
  // Line items state (start with empty array or default loading state)
  const [items, setItems] = useState([])

  // Submission & Validation States
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Fetch real Products and Subscription Plans on mount
  useEffect(() => {
    async function loadCatalog() {
      setProductsLoading(true)
      setPlansLoading(true)
      try {
        const [productList, planList] = await Promise.all([
          productService.getProducts({ limit: 100 }),
          subscriptionService.getSubscriptionPlans(),
        ])
        
        setProducts(productList)
        setSubscriptionPlans(planList)

        // Initialize default line items from real product catalog
        if (productList.length > 0) {
          const prod1 = productList[0]
          const prod2 = productList[1] || productList[0]

          const initLine1 = {
            id: 'line-' + Date.now() + '-1',
            product_id: prod1.id,
            product_name: prod1.name,
            line_type: prod1.product_type === 'subscription' ? LINE_TYPES.SUBSCRIPTION : LINE_TYPES.ONE_TIME,
            quantity: 10,
            unit_price: parseFloat(prod1.base_price) || 2500,
            discount_pct: 10,
            subscription_plan_id: null,
          }

          let initLine2 = null
          if (productList.length > 1) {
            const subPlanMatch = planList.find((p) => p.product_id === prod2.id) || planList[0]
            initLine2 = {
              id: 'line-' + Date.now() + '-2',
              product_id: prod2.id,
              product_name: prod2.name,
              line_type: subPlanMatch ? LINE_TYPES.SUBSCRIPTION : LINE_TYPES.ONE_TIME,
              quantity: 12,
              unit_price: parseFloat(prod2.base_price) || 450,
              discount_pct: 5,
              subscription_plan_id: subPlanMatch ? subPlanMatch.id : null,
            }
          }

          setItems(initLine2 ? [initLine1, initLine2] : [initLine1])
        }
      } catch (err) {
        toast.error(parseApiError(err) || 'Failed to load catalog data for quotation builder.')
      } finally {
        setProductsLoading(false)
        setPlansLoading(false)
      }
    }

    loadCatalog()
  }, [])

  // Calculations using taxService
  const totals = useMemo(() => {
    return taxService.calculateQuotationTotals(items)
  }, [items])

  const subtotal = totals.subtotal
  const discountAmount = totals.totalDiscount
  const taxAmount = totals.taxAmount
  const grandTotal = totals.grandTotal

  // Warehouse shipping calculation
  const warehouseShippingCosts = {
    'West Coast Hub': 120,
    'Central Distribution': 180,
    'East Coast Hub': 140,
  }
  const baseShipping = warehouseShippingCosts[warehouse] || 120
  const isSplitShipment = items.some((i) => i.quantity > 20)
  const splitFee = isSplitShipment ? 85 : 0
  const totalShipping = baseShipping + splitFee
  const totalContractValue = grandTotal + totalShipping

  const avgDiscount = items.length > 0 
    ? items.reduce((acc, item) => acc + (Number(item.discount_pct) || 0), 0) / items.length 
    : 0
  const excess = Math.max(0, avgDiscount - 15)
  const risky = excess > 0 || totalContractValue > 100000
  const margin = Math.max(0, 38 - excess * 1.5)

  // Deal health & win probability
  const dealHealthScore = Math.max(10, Math.min(98, Math.round(85 - excess * 2.5 + (items.length > 2 ? 8 : 0))))
  const winProbability = Math.max(20, Math.min(95, Math.round(75 - excess * 1.5 + (margin > 30 ? 10 : 0))))

  // Item Update Handler
  const updateItem = (id, key, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item

        const updated = { ...item, [key]: value }

        // If product changed, update name, price & defaults
        if (key === 'product_id') {
          const selectedProd = products.find((p) => String(p.id) === String(value))
          if (selectedProd) {
            updated.product_id = selectedProd.id
            updated.product_name = selectedProd.name
            updated.unit_price = parseFloat(selectedProd.base_price) || 0
            
            // Auto switch line type if product is a subscription
            if (selectedProd.product_type === 'subscription') {
              updated.line_type = LINE_TYPES.SUBSCRIPTION
              const matchingPlan = subscriptionPlans.find((p) => p.product_id === selectedProd.id)
              updated.subscription_plan_id = matchingPlan ? matchingPlan.id : (subscriptionPlans[0]?.id || null)
            }
          }
        }

        // If line_type changed to one_time, reset subscription_plan_id
        if (key === 'line_type') {
          if (value === LINE_TYPES.ONE_TIME) {
            updated.subscription_plan_id = null
          } else if (value === LINE_TYPES.SUBSCRIPTION && !updated.subscription_plan_id) {
            const matchingPlan = subscriptionPlans.find((p) => p.product_id === updated.product_id)
            updated.subscription_plan_id = matchingPlan ? matchingPlan.id : (subscriptionPlans[0]?.id || null)
          }
        }

        return updated
      })
    )
  }

  // Add new line item
  const addItem = () => {
    const defaultProd = products[0] || { id: 1, name: 'Standard Product', base_price: 1000 }
    const newItem = {
      id: 'line-' + Date.now(),
      product_id: defaultProd.id,
      product_name: defaultProd.name,
      line_type: LINE_TYPES.ONE_TIME,
      quantity: 1,
      unit_price: parseFloat(defaultProd.base_price) || 1000,
      discount_pct: 0,
      subscription_plan_id: null,
    }
    setItems((current) => [...current, newItem])
  }

  // Remove line item
  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  // Validate form before submission
  const validateForm = () => {
    const errors = {}

    if (!customer.trim()) {
      errors.customer = 'Customer information is required.'
    }

    if (items.length === 0) {
      errors.items = 'At least one quotation line item is required.'
    }

    items.forEach((item, idx) => {
      if (!item.product_id) {
        errors[`item_${idx}_product`] = `Line ${idx + 1}: Real Product selection is required.`
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors[`item_${idx}_quantity`] = `Line ${idx + 1}: Quantity must be greater than 0.`
      }
      if (item.unit_price === '' || Number(item.unit_price) < 0) {
        errors[`item_${idx}_price`] = `Line ${idx + 1}: Unit price must be non-negative.`
      }
      if (item.discount_pct < 0 || item.discount_pct > 100) {
        errors[`item_${idx}_discount`] = `Line ${idx + 1}: Discount must be between 0% and 100%.`
      }
      if (item.line_type === LINE_TYPES.SUBSCRIPTION && !item.subscription_plan_id) {
        errors[`item_${idx}_plan`] = `Line ${idx + 1}: Subscription plan selection is required for subscription lines.`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Quotation Submission to Backend POST /quotations
  const handleSubmitQuotation = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting the quotation.', 'Validation Error')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        customer_id: customerId || 1,
        lines: items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          discount_pct: Number(item.discount_pct) || 0,
          line_type: item.line_type,
          subscription_plan_id: item.line_type === LINE_TYPES.SUBSCRIPTION ? Number(item.subscription_plan_id) : null,
        })),
      }

      const response = await quotationService.createQuotation(payload)

      toast.success(
        `Quotation created successfully! Assigned ID: #${response.id || 'QT-NEW'}. Status: ${response.status || 'draft'}`,
        'Quotation Created'
      )

      if (onQuotationCreated) {
        onQuotationCreated(response)
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      const errorMsg = parseApiError(err) || 'Failed to submit quotation to backend server.'
      setSubmitError(errorMsg)
      toast.error(errorMsg, 'Submission Failed')
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 pb-12">
      {/* Top Header */}
      <div className="border-b bg-card px-5 py-5 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <button
              onClick={onBack}
              className="mb-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              ← Back to Quotations Workspace
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Quotation Builder</h1>
              <StatusBadge value="Draft" />
              <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
                QT-2026-BUILDER
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Commercial proposal for {customer} · Real Backend Data Integration · {saved ? 'Saved' : 'Draft mode'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSaved(true)
                toast.info('Draft configuration saved.')
                setTimeout(() => setSaved(false), 1800)
              }}
            >
              <Save data-icon="inline-start" />
              {saved ? 'Saved' : 'Save Draft'}
            </Button>

            <Button
              onClick={() => {
                if (validateForm()) {
                  setConfirmOpen(true)
                } else {
                  toast.error('Validation failed. Check product selection and quantities.')
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <ArrowRight data-icon="inline-start" />
                  Submit Quotation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="mt-6 flex min-w-[720px] items-center gap-0 overflow-x-auto">
          {lifecycle.map((step, index) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`flex items-center gap-2 text-xs font-medium ${
                  index === 0 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full border ${
                    index === 0
                      ? 'border-primary bg-primary text-primary-foreground font-bold'
                      : 'border-border bg-background'
                  }`}
                >
                  {index + 1}
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
          {/* Global API Error Notice */}
          {submitError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 shrink-0" />
                <span><strong>API Error:</strong> {submitError}</span>
              </div>
              <button onClick={() => setSubmitError('')} className="underline font-semibold cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* Form Level Error Notice */}
          {Object.keys(formErrors).length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4 text-amber-600" />
                <span>Form Validation Issues Found:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {Object.values(formErrors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Card 1: Customer / Quote Info */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Customer & Commercial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Customer Name"
                value={customer}
                onChange={setCustomer}
                error={formErrors.customer}
              />
              <FormField
                label="Customer ID (Backend Integer)"
                type="number"
                value={customerId}
                onChange={(val) => setCustomerId(Number(val))}
              />
              <FormField label="Currency" value="INR (₹) — Indian Rupee" onChange={() => {}} disabled />
              {/* <FormField
                label="Expected Delivery Date"
                value={delivery}
                onChange={setDelivery}
                type="date"
              /> */}
              {/* <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Billing Terms</span>
                <select
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="annual">Annual Subscription (Net-30)</option>
                  <option value="monthly">Monthly Recurring Billing</option>
                  <option value="onetime">One-Time Capital Purchase</option>
                </select>
              </label> */}
            </CardContent>
          </Card>

          {/* Card 2: Products & Line Items Table */}
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Quotation Line Items</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select real products from catalog and configure one-time or subscription billing.
                </p>
              </div>
              <Button size="sm" onClick={addItem} disabled={productsLoading}>
                <Plus data-icon="inline-start" />
                Add Line Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-y bg-muted/25 text-left text-xs text-muted-foreground font-semibold">
                      <th className="px-4 py-3 min-w-[200px]">Product Selection</th>
                      <th className="px-4 py-3 w-[140px]">Line Type</th>
                      <th className="px-4 py-3 min-w-[180px]">Subscription Plan</th>
                      <th className="px-4 py-3 w-[90px]">Qty</th>
                      <th className="px-4 py-3 w-[120px]">Unit Price (₹)</th>
                      <th className="px-4 py-3 w-[90px]">Disc %</th>
                      <th className="px-4 py-3 text-right w-[120px]">Line Total</th>
                      <th className="px-3 py-3 w-[50px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground">
                          No quotation lines added yet. Click "Add Line Item" above.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const isSub = item.line_type === LINE_TYPES.SUBSCRIPTION
                        const qty = Number(item.quantity) || 0
                        const price = Number(item.unit_price) || 0
                        const disc = Number(item.discount_pct) || 0
                        const lineSubtotal = qty * price * (1 - disc / 100)

                        // Filter subscription plans matching this product ID if available
                        const matchingPlans = subscriptionPlans.filter(
                          (plan) => String(plan.product_id) === String(item.product_id)
                        )
                        const availablePlans = matchingPlans.length > 0 ? matchingPlans : subscriptionPlans

                        return (
                          <tr key={item.id} className="hover:bg-muted/20">
                            {/* Product Dropdown */}
                            <td className="px-4 py-3">
                              {productsLoading ? (
                                <span className="text-xs text-muted-foreground">Loading products...</span>
                              ) : (
                                <select
                                  value={item.product_id}
                                  onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary font-medium"
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({formatCurrency(p.base_price)}) — [{p.product_type}]
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>

                            {/* Line Type Dropdown */}
                            <td className="px-4 py-3">
                              <select
                                value={item.line_type}
                                onChange={(e) => updateItem(item.id, 'line_type', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary font-semibold"
                              >
                                <option value={LINE_TYPES.ONE_TIME}>One-time</option>
                                <option value={LINE_TYPES.SUBSCRIPTION}>Subscription</option>
                              </select>
                            </td>

                            {/* Subscription Plan Dropdown */}
                            <td className="px-4 py-3">
                              {isSub ? (
                                plansLoading ? (
                                  <span className="text-xs text-muted-foreground">Loading plans...</span>
                                ) : (
                                  <select
                                    value={item.subscription_plan_id || ''}
                                    onChange={(e) => updateItem(item.id, 'subscription_plan_id', e.target.value)}
                                    className="w-full rounded-md border border-purple-200 bg-purple-50/50 text-purple-950 px-2 py-1.5 text-xs outline-none focus:border-primary font-medium"
                                  >
                                    <option value="">-- Select Plan --</option>
                                    {availablePlans.map((plan) => (
                                      <option key={plan.id} value={plan.id}>
                                        Plan #{plan.id} ({plan.billing_cycle}) - {plan.product?.name || 'Product'}
                                      </option>
                                    ))}
                                  </select>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground italic px-2">N/A (One-time)</span>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-center outline-none focus:border-primary"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                              />
                            </td>

                            {/* Discount % */}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount_pct}
                                onChange={(e) => updateItem(item.id, 'discount_pct', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-center outline-none focus:border-primary"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(lineSubtotal)}
                            </td>

                            {/* Delete Action */}
                            <td className="px-3 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                aria-label="Remove line item"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Discount Governance */}
          <Card className={risky ? 'border-amber-200 shadow-none' : 'shadow-none'}>
            <CardHeader>
              <CardTitle className="text-base">Governance & Approval Checks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Standard Policy Max Discount</p>
                  <p className="mt-1 font-semibold text-foreground">15%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quote Average Discount</p>
                  <p className="mt-1 font-semibold text-foreground">{avgDiscount.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approval Status Required</p>
                  <p className={`mt-1 font-semibold ${risky ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {risky ? 'Requires Manager Approval' : 'Pre-Approved'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Commercial Summary & Totals */}
        <aside className="flex flex-col gap-6">
          <DealHealthPanel
            score={dealHealthScore}
            winProbability={winProbability}
            risky={risky}
            margin={margin}
            excess={excess}
          />

          <Card className="shadow-none border-primary/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Commercial Summary (INR)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount</span>
                  <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Net Amount (Pre-Tax)</span>
                <span className="font-medium text-foreground">{formatCurrency(totals.netSubtotal)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>GST Tax ({totals.taxRate}%)</span>
                <span className="font-medium text-foreground">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Freight</span>
                <span className="font-medium text-foreground">{formatCurrency(totalShipping)}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-3 font-bold text-base">
                <span className="text-foreground">Grand Total</span>
                <span className="text-primary text-lg">{formatCurrency(totalContractValue)}</span>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                Taxes computed strictly via active Tax configuration ({totals.taxName}).
              </p>

              <Button
                className="w-full mt-2"
                onClick={() => {
                  if (validateForm()) {
                    setConfirmOpen(true)
                  } else {
                    toast.error('Please fix line item validation errors.')
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quotation'}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Quotation Creation?"
        description={`This will create a new quotation with ${items.length} line item${items.length !== 1 ? 's' : ''} and a total value of ${formatCurrency(totalContractValue)}. The quotation will start in Draft status.`}
        onConfirm={handleSubmitQuotation}
      />
    </main>
  )
}

function DealHealthPanel({ score, winProbability, risky, margin, excess }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Deal Health & Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-semibold tracking-tight">
              {score}
              <span className="text-lg text-muted-foreground"> / 100</span>
            </p>
            <p className={`mt-1 text-xs font-semibold ${score < 50 ? 'text-rose-700' : score < 75 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {score < 50 ? 'HIGH RISK' : score < 75 ? 'MODERATE RISK' : 'HEALTHY DEAL'}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-muted">
            <CircleDollarSign className={risky ? 'text-amber-600' : 'text-emerald-600'} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win Probability</span>
            <span className="font-semibold text-blue-600">{winProbability}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Margin</span>
            <span className="font-medium">{margin.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuotationBuilder
