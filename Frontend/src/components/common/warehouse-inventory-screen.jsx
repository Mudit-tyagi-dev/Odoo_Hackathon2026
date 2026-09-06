'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
  X,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { getWarehouse, calcCapacity } from '../../services/warehouseService'
import { getProducts } from '../../services/productService'
import {
  upsertWarehouseStock,
  getWarehouseStock,
  parseInventoryValidationError,
} from '../../services/warehouseInventoryService'
import { parseApiError } from '../../utils/errorHandler'

/**
 * Add / Update Warehouse Inventory Screen
 *
 * Requirements:
 * - Route: /admin/warehouses/:warehouseId/inventory/add
 * - Warehouse ID is bound from route/props (never manually entered)
 * - Products loaded via real Product API/service (searchable select dropdown)
 * - Quantity: required, integer >= 0, proper inline validation
 * - Backend POST /warehouse-inventory is UPSERT (contract: warehouse_id, product_id, quantity)
 * - Refreshes warehouse data on success, shows toast, returns to Warehouse Details
 */
export function AddInventoryScreen({
  warehouseId,
  initialProductId = null,
  onNavigate,
  onBack,
  onWarehouseLoaded,
  onInventoryAdded,
}) {
  const toast = useToast()

  // Warehouse state
  const [warehouse, setWarehouse] = useState(null)
  const [loadingWarehouse, setLoadingWarehouse] = useState(true)
  const [warehouseError, setWarehouseError] = useState('')

  // Product list state
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')

  // Form selection state
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId ? Number(initialProductId) : null
  )
  const [existingStock, setExistingStock] = useState(null)
  const [loadingStockCheck, setLoadingStockCheck] = useState(false)
  const [quantity, setQuantity] = useState('')

  // Search & dropdown UI state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  // Submission & validation state
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ─────────────────────────────────────────────
  // 1. Fetch warehouse details
  // ─────────────────────────────────────────────
  const fetchWarehouseData = useCallback(async () => {
    if (!warehouseId) return
    setLoadingWarehouse(true)
    setWarehouseError('')
    try {
      const data = await getWarehouse(warehouseId)
      setWarehouse(data)
      if (onWarehouseLoaded && data?.name) {
        onWarehouseLoaded(data.name)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setWarehouseError('Warehouse not found.')
      } else {
        setWarehouseError(parseApiError(err) || 'Failed to load warehouse.')
      }
    } finally {
      setLoadingWarehouse(false)
    }
  }, [warehouseId, onWarehouseLoaded])

  // ─────────────────────────────────────────────
  // 2. Fetch products from Product Service
  // ─────────────────────────────────────────────
  const fetchProductsList = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError('')
    try {
      const data = await getProducts({ skip: 0, limit: 100 })
      setProducts(data)
    } catch (err) {
      setProductsError(parseApiError(err) || 'Failed to load products.')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    fetchWarehouseData()
    fetchProductsList()
  }, [fetchWarehouseData, fetchProductsList])

  // ─────────────────────────────────────────────
  // 3. When a product is selected, check existing stock in this warehouse
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!warehouseId || !selectedProductId) {
      setExistingStock(null)
      return
    }

    // Check if the warehouse.products already has this product
    const existingInWarehouse = warehouse?.products?.find(
      (p) => Number(p.product_id) === Number(selectedProductId)
    )

    if (existingInWarehouse) {
      setExistingStock(existingInWarehouse)
      // Pre-fill quantity if not already filled
      setQuantity(String(existingInWarehouse.quantity ?? 0))
      return
    }

    // Otherwise check backend single inventory endpoint
    let isCancelled = false
    setLoadingStockCheck(true)
    getWarehouseStock(warehouseId, selectedProductId)
      .then((data) => {
        if (!isCancelled && data) {
          setExistingStock(data)
          setQuantity(String(data.quantity ?? 0))
        }
      })
      .catch(() => {
        // 404 or not found is normal for new combination
        if (!isCancelled) {
          setExistingStock(null)
          setQuantity('')
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingStockCheck(false)
      })

    return () => {
      isCancelled = true
    }
  }, [warehouseId, selectedProductId, warehouse])

  // Find currently selected product object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null
    return products.find((p) => Number(p.id) === Number(selectedProductId)) || null
  }, [products, selectedProductId])

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const term = productSearch.toLowerCase()
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase()
      const cat = (p.category?.name || p.product_type || '').toLowerCase()
      const id = String(p.id)
      return name.includes(term) || cat.includes(term) || id.includes(term)
    })
  }, [products, productSearch])

  // ─────────────────────────────────────────────
  // 4. Validation
  // ─────────────────────────────────────────────
  const validate = () => {
    const errs = {}

    if (!selectedProductId) {
      errs.product_id = 'Please select a product from the list.'
    }

    if (quantity === '' || quantity === null || quantity === undefined) {
      errs.quantity = 'Quantity is required.'
    } else {
      const num = Number(quantity)
      if (isNaN(num)) {
        errs.quantity = 'Quantity must be a valid number.'
      } else if (!Number.isInteger(num)) {
        errs.quantity = 'Quantity must be a whole integer.'
      } else if (num < 0) {
        errs.quantity = 'Quantity must be greater than or equal to 0.'
      }
    }

    return errs
  }

  // ─────────────────────────────────────────────
  // 5. Submit handler
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setSubmitError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        warehouse_id: Number(warehouseId),
        product_id: Number(selectedProductId),
        quantity: Number(quantity),
      }

      await upsertWarehouseStock(payload)

      setSubmitSuccess(true)
      const actionType = existingStock ? 'updated' : 'added'
      toast.success(
        `Inventory successfully ${actionType} for ${selectedProduct?.name || 'product'} (${Number(quantity).toLocaleString()} units).`,
        'Inventory Updated'
      )

      if (onInventoryAdded) {
        onInventoryAdded()
      }

      // Return to warehouse details
      setTimeout(() => {
        onNavigate(`/admin/warehouses/${warehouseId}`)
      }, 600)
    } catch (err) {
      const parsedErrors = parseInventoryValidationError(err)
      if (Object.keys(parsedErrors).length > 0) {
        setFieldErrors(parsedErrors)
      } else {
        setSubmitError(
          parseApiError(err) || 'Failed to update warehouse inventory. Please verify input.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Capacity calculations
  const maxCapacity = warehouse?.max_qty ?? warehouse?.max_q ?? 0
  const currentTotal = warehouse?.total_quantity ?? 0
  const { utilization } = warehouse ? calcCapacity(warehouse) : { utilization: 0 }

  // Projected capacity impact
  const enteredQty = Number(quantity)
  const isQtyValid = !isNaN(enteredQty) && enteredQty >= 0 && quantity !== ''
  const prevItemQty = existingStock ? Number(existingStock.quantity ?? 0) : 0
  const projectedTotal = isQtyValid
    ? currentTotal - prevItemQty + enteredQty
    : currentTotal
  const projectedUtilization =
    maxCapacity > 0 ? (projectedTotal / maxCapacity) * 100 : 0
  const isOverCapacity = maxCapacity > 0 && projectedTotal > maxCapacity

  // ─────────────────────────────────────────────
  // Render loading / error states
  // ─────────────────────────────────────────────
  if (loadingWarehouse && !warehouse) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-3xl p-5 md:p-8 flex flex-col gap-5">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </main>
    )
  }

  if (warehouseError && !warehouse) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-3xl p-5 md:p-8">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="size-8 text-destructive/60" />
            <p className="text-sm font-medium text-destructive">{warehouseError}</p>
            <Button variant="outline" size="sm" onClick={fetchWarehouseData} className="gap-2">
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
          <Button variant="ghost" className="mt-4 gap-2" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back to Warehouses
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Page Header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onNavigate(`/admin/warehouses/${warehouseId}`)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              {warehouse?.name || `Warehouse #${warehouseId}`}
            </button>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Add / Update Inventory</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign product stock to this warehouse. Updates existing stock or adds new product inventory.
              </p>
            </div>
            <Badge variant="outline" className="w-fit gap-1 text-xs py-1 px-2.5">
              <Building2 className="size-3 text-muted-foreground" />
              Warehouse ID: <span className="font-semibold text-foreground">#{warehouseId}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl flex flex-col gap-6 p-5 md:p-8">
        {/* Warehouse Context Banner */}
        {warehouse && (
          <Card className="shadow-none border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Warehouse className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{warehouse.name}</h3>
                      <Badge variant="secondary" className="text-[11px]">
                        #{warehouse.id}
                      </Badge>
                    </div>
                    {warehouse.address && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {warehouse.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t pt-3 sm:border-t-0 sm:pt-0">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Current Stock
                    </p>
                    <p className="text-base font-bold tabular-nums">
                      {(warehouse.total_quantity ?? 0).toLocaleString()}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        / {(maxCapacity ?? 0).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Utilization
                    </p>
                    <p className="text-base font-bold tabular-nums text-foreground">
                      {utilization.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Upsert Form */}
        <form onSubmit={handleSubmit} noValidate>
          <Card className="shadow-none">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Select Product & Enter Quantity
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 p-6">
              {/* Warehouse ID (Auto-bound, non-editable) */}
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="font-medium text-muted-foreground">
                  Target Warehouse
                </label>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="font-medium">{warehouse?.name || `Warehouse #${warehouseId}`}</span>
                    <span className="text-xs text-muted-foreground">(ID: {warehouseId})</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    Auto-bound from route
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Warehouse is automatically locked to the active warehouse route.
                </span>
              </div>

              {/* Product Selection Dropdown */}
              <div className="flex flex-col gap-1.5 text-sm">
                <label htmlFor="product-select" className="font-medium">
                  Product <span className="text-destructive">*</span>
                </label>

                {/* Dropdown container */}
                <div className="relative">
                  {selectedProduct ? (
                    // Selected product pill / card
                    <div className="flex items-center justify-between rounded-md border bg-card p-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Package className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedProduct.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              #{selectedProduct.id}
                            </Badge>
                            {selectedProduct.category?.name && (
                              <Badge variant="outline" className="text-[10px]">
                                {selectedProduct.category.name}
                              </Badge>
                            )}
                          </div>
                          {selectedProduct.base_price && (
                            <p className="text-xs text-muted-foreground">
                              Base Price: ₹{Number(selectedProduct.base_price).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => {
                            setSelectedProductId(null)
                            setExistingStock(null)
                            setQuantity('')
                            setDropdownOpen(true)
                          }}
                        >
                          <X className="size-3.5" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Dropdown trigger button
                    <button
                      type="button"
                      id="product-select-trigger"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-sm text-left shadow-xs transition-colors',
                        fieldErrors.product_id ? 'border-destructive' : 'hover:border-primary/60'
                      )}
                    >
                      <span className="text-muted-foreground">
                        {loadingProducts ? 'Loading products catalog…' : 'Choose a product from catalog…'}
                      </span>
                      {loadingProducts ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {dropdownOpen && !selectedProduct && (
                    <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Search input */}
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                          <Input
                            autoFocus
                            id="product-search-input"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Filter by product name, category or ID…"
                            className="h-8 pl-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="max-h-60 overflow-y-auto p-1 text-xs">
                        {loadingProducts ? (
                          <div className="flex items-center justify-center p-6 text-muted-foreground">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Loading products…
                          </div>
                        ) : productsError ? (
                          <div className="p-4 text-center">
                            <p className="text-destructive mb-2">{productsError}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchProductsList}
                            >
                              Retry
                            </Button>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            No products found matching &ldquo;{productSearch}&rdquo;.
                          </div>
                        ) : (
                          filteredProducts.map((p) => {
                            const inWarehouse = warehouse?.products?.find(
                              (wp) => Number(wp.product_id) === Number(p.id)
                            )
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProductId(p.id)
                                  setDropdownOpen(false)
                                  setProductSearch('')
                                  setFieldErrors((prev) => ({ ...prev, product_id: undefined }))
                                }}
                                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-accent cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">
                                    #{p.id}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{p.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {p.category?.name || p.product_type || 'General'} • ₹
                                      {Number(p.base_price || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {inWarehouse && (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-200 bg-blue-50 text-blue-700 text-[10px]"
                                  >
                                    In stock: {inWarehouse.quantity}
                                  </Badge>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {fieldErrors.product_id && (
                  <span className="text-xs text-destructive">{fieldErrors.product_id}</span>
                )}

                {/* Existing Stock indicator */}
                {selectedProduct && (
                  <div className="mt-1">
                    {loadingStockCheck ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin" />
                        Checking existing warehouse stock…
                      </span>
                    ) : existingStock ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
                        <span className="font-semibold text-amber-700 mt-0.5">ℹ</span>
                        <div>
                          <p className="font-medium">
                            Product is currently in this warehouse: {(existingStock.quantity ?? 0).toLocaleString()} units.
                          </p>
                          <p className="text-amber-800 text-[11px] mt-0.5">
                            Submitting will update (UPSERT) the quantity for this product in {warehouse?.name || 'this warehouse'}.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        This product currently has no inventory in this warehouse. A new stock entry will be created.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="flex flex-col gap-1.5 text-sm">
                <label htmlFor="inventory-quantity" className="font-medium">
                  Quantity <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="inventory-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, quantity: undefined }))
                    }}
                    placeholder="Enter stock quantity (e.g. 150)"
                    aria-invalid={Boolean(fieldErrors.quantity)}
                    className={cn(
                      'tabular-nums text-base',
                      fieldErrors.quantity ? 'border-destructive' : ''
                    )}
                  />
                </div>
                {fieldErrors.quantity && (
                  <span className="text-xs text-destructive">{fieldErrors.quantity}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  Must be an integer greater than or equal to 0.
                </span>
              </div>

              {/* Projected Capacity Impact Preview */}
              {isQtyValid && selectedProduct && warehouse && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="size-3.5" />
                      Warehouse Capacity Impact
                    </p>
                    {isOverCapacity && (
                      <Badge variant="destructive" className="text-[10px]">
                        Exceeds Capacity
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                    <div className="rounded bg-card p-2 border">
                      <p className="text-muted-foreground text-[11px]">Current Total</p>
                      <p className="text-sm font-bold mt-0.5">{currentTotal.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-card p-2 border">
                      <p className="text-muted-foreground text-[11px]">
                        {existingStock ? 'Updated Stock' : 'New Stock'}
                      </p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {enteredQty.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded bg-card p-2 border">
                      <p className="text-muted-foreground text-[11px]">Projected Total</p>
                      <p
                        className={cn(
                          'text-sm font-bold mt-0.5',
                          isOverCapacity ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {projectedTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Projected Utilization</span>
                      <span className="font-semibold tabular-nums">
                        {projectedUtilization.toFixed(1)}% of {(maxCapacity ?? 0).toLocaleString()} max
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          projectedUtilization >= 95
                            ? 'bg-rose-500'
                            : projectedUtilization >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(100, projectedUtilization)}%` }}
                      />
                    </div>
                  </div>

                  {isOverCapacity && (
                    <p className="mt-2 text-xs text-rose-600">
                      Warning: Setting this quantity will bring the warehouse {(projectedTotal - maxCapacity).toLocaleString()} units over its maximum capacity ({(maxCapacity ?? 0).toLocaleString()}).
                    </p>
                  )}
                </div>
              )}

              {/* Submit Error */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Failed to save inventory</p>
                    <p className="text-xs text-destructive/90 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Submit Success */}
              {submitSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 flex items-center gap-2">
                  <Check className="size-4 text-emerald-600" />
                  Inventory saved successfully! Returning to Warehouse Details…
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate(`/admin/warehouses/${warehouseId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="submit-inventory-btn"
              disabled={isSubmitting || submitSuccess || !selectedProductId || quantity === ''}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving Stock…
                </>
              ) : existingStock ? (
                'Update Stock'
              ) : (
                'Add Inventory'
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AddInventoryScreen
