'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { PackagePlus, Pencil, Plus, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, Check, Eye, Loader2  } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminCollections } from './dealflow-data'
import { ConfirmDialog, DataTable, FormField, SectionHeader, Toolbar } from './dealflow-ui'
import { useWorkspace } from './workspace-context'
import { useToast } from '@/components/ui/Toast'
import api from '../../services/api'
import productService from '../../services/productService'
import { getSubscriptionPlans } from '../../services/subscriptionService'
import discountRuleService from '../../services/discountRuleService'
import { parseApiError } from '../../utils/errorHandler'
import { formatCurrency } from '../../utils/formatters'
import taxService from '../../services/taxService'
const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100]

const PRODUCT_TYPE_LABELS = {
  hardware: 'Hardware',
  service: 'Service',
  subscription: 'Subscription',
}

function productTypeLabel(value) {
  if (!value) return '—'
  return PRODUCT_TYPE_LABELS[value] || value
}

const BILLING_CYCLE_LABELS = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  weekly: 'Weekly',
}

function billingCycleLabel(value) {
  if (!value) return '—'
  return BILLING_CYCLE_LABELS[value] || value
}

export function AdminScreen({ section, onAddProduct }) {
  const config = section === 'products' ? null : adminCollections[section]
  const title = config?.title ?? 'Products'
  const description =
    config?.description ?? 'Manage the product catalog used across quotations and price lists.'
  const { search, setSearch } = useWorkspace()
  const toast = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [productType, setProductType] = useState('hardware')
  const [basePrice, setBasePrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [tax, setTax] = useState('')
  const [isSubscription, setIsSubscription] = useState(false)
  const [quantityInHand, setQuantityInHand] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [unit, setUnit] = useState('Each')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [productsData, setProductsData] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(null)
  const pageRef = useRef(1)
  const pageSizeRef = useRef(20)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false)
  const [subscriptionPlansError, setSubscriptionPlansError] = useState('')

  // View Product Modal state
  const [viewProductModalOpen, setViewProductModalOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState(null)

  // Edit Product Modal state
  const [editProductModalOpen, setEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState(null)
  const [editSelectedCategory, setEditSelectedCategory] = useState('')
  const [editProductType, setEditProductType] = useState('hardware')
  const [editBasePrice, setEditBasePrice] = useState('')
  const [editCostPrice, setEditCostPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] = useState(false)
  const [editCategorySearch, setEditCategorySearch] = useState('')
  const editCategoryRef = useRef(null)

  // Delete Product Modal state
  const [deleteProductConfirmOpen, setDeleteProductConfirmOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleViewProduct = (product) => {
    setViewingProduct(product)
    setViewProductModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setEditName(product.name || '')
    setEditCategoryId(product.category_id || null)
    setEditSelectedCategory(
      product.category?.name ||
      categories.find((c) => c.id === product.category_id)?.name ||
      ''
    )
    setEditProductType(product.product_type || 'hardware')
    setEditBasePrice(product.base_price != null ? String(product.base_price) : '')
    setEditCostPrice(product.cost_price != null ? String(product.cost_price) : '')
    setEditDescription(product.description || '')
    setEditError('')
    setEditCategoryDropdownOpen(false)
    setEditCategorySearch('')
    setEditProductModalOpen(true)
  }

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product)
    setDeleteError('')
    setDeleteProductConfirmOpen(true)
  }

  // Discount Rules state — populated from GET /discount-rules/
  const [discountRulesData, setDiscountRulesData] = useState([])
  const [discountRulesLoading, setDiscountRulesLoading] = useState(false)
  const [discountRulesError, setDiscountRulesError] = useState('')

  // Tax configuration state
  const [taxRules, setTaxRules] = useState(() => taxService.getTaxRules())

  const handleToggleTaxActive = (id) => {
    const updated = taxService.setActiveTaxRule(id)
    setTaxRules(updated)
    toast.success('Active tax configuration updated for quotations.')
  }

  const handleUpdateTaxPercentage = (id, newPct) => {
    const updated = taxService.updateTaxRule(id, { percentage: Number(newPct) || 0 })
    setTaxRules(updated)
    toast.info('Tax percentage rate updated.')
  }

  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [activeFilter, setActiveFilter] = useState('all')

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'category', label: 'Category' },
  ]

  const filterOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
  ]

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlSearch = params.get('search')
    if (urlSearch && !search) setSearch(urlSearch)
    const urlSort = params.get('sort') || 'name'
    setSortBy(urlSort)
    const urlOrder = params.get('order') || 'asc'
    setSortDirection(urlOrder)
    const urlFilter = params.get('filter') || 'all'
    setActiveFilter(urlFilter)
  }, [search, setSearch])

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (search) params.set('search', search)
    else params.delete('search')
    params.set('sort', sortBy)
    params.set('order', sortDirection)
    if (activeFilter !== 'all') params.set('filter', activeFilter)
    else params.delete('filter')
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [search, sortBy, sortDirection, activeFilter])

  const [activeFilters, setActiveFilters] = useState([])
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const categoryRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false)
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [categoryDropdownOpen])

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const removeFilter = (filterToRemove) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filterToRemove))
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    setActiveFilter('all')
    setSortBy('name')
    setSortDirection('asc')
    setSearch('')
  }

  const categoryIdFilter =
    activeFilter && activeFilter !== 'all'
      ? categories.find((c) => c.name === activeFilter)?.id
      : undefined

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    setCategoryError('')
    try {
      const catList = await productService.getProductCategories()
      setCategories(catList)
    } catch (err) {
      setCategoryError(parseApiError(err) || 'Failed to load categories.')
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(
    async (targetPage = pageRef.current, targetSize = pageSizeRef.current) => {
      setProductsLoading(true)
      setProductsError('')
      try {
        const skip = (targetPage - 1) * targetSize
        const data = await productService.getProducts({
          search: search || undefined,
          category_id: categoryIdFilter,
          skip,
          limit: Math.min(targetSize, 100),
        })
        // The current API returns a plain array. If it ever sends an envelope
        // ({ data, total/count }), surface the real total/count from it.
        let items = Array.isArray(data) ? data : []
        let total = null
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          items = data.data
          total =
            typeof data.total === 'number'
              ? data.total
              : typeof data.count === 'number'
                ? data.count
                : null
        }
        pageRef.current = targetPage
        pageSizeRef.current = targetSize
        setProductsData(items)
        setTotalCount(total)
        setCurrentPage(targetPage)
        setPageSize(targetSize)
      } catch (err) {
        setProductsError(parseApiError(err) || 'Failed to load products.')
      } finally {
        setProductsLoading(false)
      }
    },
    [search, categoryIdFilter]
  )

  const fetchSubscriptionPlans = useCallback(async () => {
    setSubscriptionPlansLoading(true)
    setSubscriptionPlansError('')
    try {
      const data = await getSubscriptionPlans()
      setSubscriptionPlans(data)
    } catch (err) {
      setSubscriptionPlansError(parseApiError(err) || 'Failed to load subscription plans.')
    } finally {
      setSubscriptionPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    if (section === 'products') {
      fetchCategories()
      fetchProducts(1, pageSizeRef.current)
    }
  }, [section, fetchCategories, fetchProducts])

  // Fetch real subscription plans when the Subscription Plans page mounts
  useEffect(() => {
    if (section === 'subscription-plans') {
      fetchSubscriptionPlans()
    }
  }, [section, fetchSubscriptionPlans])

  // Fetch real discount rules from GET /discount-rules/ when the page mounts
  const fetchDiscountRules = useCallback(async () => {
    setDiscountRulesLoading(true)
    setDiscountRulesError('')
    try {
      const data = await discountRuleService.getDiscountRules()
      setDiscountRulesData(data)
    } catch (err) {
      setDiscountRulesError(parseApiError(err) || 'Failed to load discount rules.')
    } finally {
      setDiscountRulesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (section === 'discount-rules') {
      fetchDiscountRules()
    }
  }, [section, fetchDiscountRules])

  // Process filtered and sorted product records
  const filteredSortedProducts = useMemo(() => {
    if (section !== 'products') return []
    return productsData
      .filter((product) => {
        if (!search) return true
        const q = search.toLowerCase()
        const nameMatch = (product.name || '').toLowerCase().includes(q)
        const descMatch = (product.description || '').toLowerCase().includes(q)
        const catName = (
          product.category?.name ||
          categories.find((c) => c.id === product.category_id)?.name ||
          ''
        ).toLowerCase()
        const catMatch = catName.includes(q)
        const idMatch = String(product.id || '').includes(q)
        return nameMatch || descMatch || catMatch || idMatch
      })
      .filter((product) => {
        if (activeFilter === 'all') return true
        const catName =
          product.category?.name ||
          categories.find((c) => c.id === product.category_id)?.name
        return catName === activeFilter
      })
      .sort((a, b) => {
        let aValue, bValue
        if (sortBy === 'price') {
          aValue = parseFloat(a.base_price) || 0
          bValue = parseFloat(b.base_price) || 0
        } else if (sortBy === 'category') {
          aValue = (
            a.category?.name ||
            categories.find((c) => c.id === a.category_id)?.name ||
            ''
          ).toLowerCase()
          bValue = (
            b.category?.name ||
            categories.find((c) => c.id === b.category_id)?.name ||
            ''
          ).toLowerCase()
        } else {
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
  }, [section, productsData, search, categories, activeFilter, sortBy, sortDirection])

  const rows =
    section === 'products'
      ? filteredSortedProducts.map((product) => {
          const catName =
            product.category?.name ||
            categories.find((c) => c.id === product.category_id)?.name ||
            'Standard'
          return [
            product.name,
            catName,
            formatCurrency(product.base_price),
            productTypeLabel(product.product_type),
            'Active',
          ]
        })
        : section === 'subscription-plans'
        ? subscriptionPlans.map((plan) => [
            plan.product?.name || '—',
            billingCycleLabel(plan.billing_cycle),
            productTypeLabel(plan.product?.product_type),
            '—',
            '—',
          ])
        : section === 'discount-rules'
        ? discountRulesData.map((rule) => discountRuleService.mapRuleToRow(rule))
        : config?.rows || []

  // ── Pagination (products) ────────────────────────────────────────
  const hasPrevPage = currentPage > 1
  const hasNextPage = !productsLoading && productsData.length === pageSize
  const showingStart =
    productsData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingEnd = (currentPage - 1) * pageSize + productsData.length
  // The API currently returns a plain array (no total/count), so we never
  // fabricate a total. When the response DOES expose total/count we show it.
  const rangeLabel =
    productsData.length === 0
      ? totalCount != null
        ? `Showing 0 of ${totalCount}`
        : 'Showing 0'
      : totalCount != null
        ? `Showing ${showingStart}–${showingEnd} of ${totalCount}`
        : `Showing ${showingStart}–${showingEnd}`

  // Page numbers: render a small window around the current page, plus the next
  // page only once we know it exists (current page came back full).
  const startPage = Math.max(1, currentPage - 2)
  const endPage = hasNextPage ? currentPage + 1 : currentPage
  const rawPages = []
  for (let p = startPage; p <= endPage; p += 1) rawPages.push(p)
  if (!rawPages.includes(1)) rawPages.unshift(1)
  const pageItems = []
  let lastPage = 0
  for (const p of rawPages) {
    if (lastPage > 0 && p > lastPage + 1) pageItems.push('…')
    pageItems.push(p)
    lastPage = p
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/20">
      <div className="border-b border-border bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title={title}
          description={description}
          action={section === 'products' ? 'Add Product' : `Add ${title.slice(0, -1)}`}
          onAction={() => {
            if (section !== 'products') {
              toast.info(`The ${title} configuration API will be connected when available.`, 'API Notice')
              return
            }
            setError('')
            setName('')
            setCategoryId(null)
            setProductType('hardware')
            setBasePrice('')
            setCostPrice('')
            setTax('')
            setIsSubscription(false)
            setQuantityInHand('')
            setProductDescription('')
            setUnit('Each')
            setCategoryDropdownOpen(false)
            setCategorySearch('')
            setSelectedCategory('')
            setCreateError('')
            setCreateSuccess(false)
            setFormOpen(true)
            if (onAddProduct) onAddProduct()
          }}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 p-5 md:p-8">
        <Toolbar
          search={search}
          setSearch={setSearch}
          filters={section === 'products' ? activeFilters : []}
          onClear={clearAllFilters}
          onRemoveFilter={removeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          sortOptions={sortOptions}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filterOptions={filterOptions}
        />

        {section === 'products' ? (
          productsLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading real catalog products…
            </div>
          ) : productsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {productsError}
            </div>
          ) : (
            <DataTable
              columns={['Product', 'Category', 'Price', 'Product Type', 'Status']}
              rows={rows}
              rawItems={filteredSortedProducts}
              search=""
              emptyText="No products found."
              emptyDescription="No products match your current search or category filter. Click 'Clear all' to view the complete catalog."
              onViewRow={(prod) => handleViewProduct(prod)}
              onEditRow={(prod) => handleEditProduct(prod)}
              onDeleteRow={(prod) => handleDeleteProduct(prod)}
            />
          )
        ) : section === 'subscription-plans' ? (
          subscriptionPlansLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading subscription plans…
            </div>
          ) : subscriptionPlansError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {subscriptionPlansError}
            </div>
          ) : (
            <DataTable
              columns={config?.columns || []}
              rows={rows}
              search={search}
              emptyText={`No ${title.toLowerCase()} configured.`}
              emptyDescription="This configuration module will synchronize with the backend once the corresponding management endpoints are available."
            />
          )
        ) : section === 'discount-rules' ? (
          discountRulesLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading discount rules…
            </div>
          ) : discountRulesError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {discountRulesError}
            </div>
          ) : (
            <DataTable
              columns={config?.columns || []}
              rows={rows}
              search={search}
              emptyText="No discount rules configured."
              emptyDescription="No discount rules have been created yet. Use 'Add Discount Rule' to configure tier-based discount guardrails."
            />
          )
        ) : section === 'tax-rules' ? (
          <Card className="shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground font-semibold">
                      <th className="px-4 py-3">Tax Rule Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">GST Rate (%)</th>
                      <th className="px-4 py-3">Category Scope</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {taxRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{rule.code}</td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rule.percentage}
                            onChange={(e) => handleUpdateTaxPercentage(rule.id, e.target.value)}
                            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary font-bold"
                          />
                          <span className="ml-1 text-xs font-semibold">%</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs capitalize text-foreground font-medium">
                          {rule.applicableCategory}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              rule.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {rule.isActive ? 'Active (Applied to Quotes)' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant={rule.isActive ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleTaxActive(rule.id)}
                            className="text-xs"
                          >
                            {rule.isActive ? 'Active' : 'Set Active Rule'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={config?.columns || []}
            rows={rows}
            search={search}
            emptyText={`No ${title.toLowerCase()} configured.`}
            emptyDescription="This configuration module will synchronize with the backend once the corresponding management endpoints are available."
          />
        )}

        {section === 'products' ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  aria-label="Rows per page"
                  onChange={(e) => {
                    const nextSize = Number(e.target.value)
                    setPageSize(nextSize)
                    setCurrentPage(1)
                    fetchProducts(1, nextSize)
                  }}
                  className="px-2 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <span>{productsLoading ? 'Loading…' : rangeLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevPage || productsLoading}
                onClick={() => fetchProducts(currentPage - 1)}
                className="gap-1.5"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              {pageItems.map((item, index) =>
                item === '…' ? (
                  <span key={`page-gap-${index}`} className="px-1">
                    …
                  </span>
                ) : (
                  <Button
                    key={`page-${item}`}
                    variant={item === currentPage ? 'primary' : 'outline'}
                    size="sm"
                    disabled={productsLoading}
                    onClick={() => fetchProducts(item)}
                    className="min-w-[30px] px-2"
                  >
                    {item}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage || productsLoading}
                onClick={() => fetchProducts(currentPage + 1)}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </span>
            <span>Page 1 of 1</span>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FormField
              label="Name"
              value={name}
              onChange={(value) => {
                setName(value)
                setError('')
              }}
              error={error}
              placeholder="Product name (e.g. Industrial Sensor Kit)"
            />

            <div className="flex flex-col gap-4">
              {/* Category dropdown (dynamic) */}
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="font-medium text-foreground">Category</label>
                <div className="relative" ref={categoryRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen((o) => !o)}
                    disabled={categoriesLoading}
                    className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-within:border-primary disabled:opacity-50 cursor-pointer"
                  >
                    <span className={selectedCategory ? 'text-foreground' : 'text-muted-foreground'}>
                      {selectedCategory || 'Select a category'}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>

                  {categoryDropdownOpen && (
                    <div className="absolute top-full z-20 mt-1 w-full min-w-[200px] rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100">
                      <div className="border-b border-border p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 pl-8 text-xs outline-none focus:border-primary text-foreground"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredCategories.length === 0 ? (
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            No categories found
                          </div>
                        ) : (
                          filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(cat.id)
                                setSelectedCategory(cat.name)
                                setCategoryDropdownOpen(false)
                                setError('')
                              }}
                              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                              <span>{cat.name}</span>
                              {categoryId === cat.id && (
                                <Check className="size-3.5 text-primary" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Base price (₹)"
                  value={basePrice}
                  onChange={setBasePrice}
                  placeholder="0.00"
                  type="number"
                />
                <FormField
                  label="Cost price (₹)"
                  value={costPrice}
                  onChange={setCostPrice}
                  placeholder="0.00"
                  type="number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Tax (%)"
                  value={tax}
                  onChange={setTax}
                  placeholder="18"
                  type="number"
                />
                <FormField
                  label="Quantity in hand"
                  value={quantityInHand}
                  onChange={setQuantityInHand}
                  placeholder="0"
                  type="number"
                />
              </div>

              <FormField
                label="Description"
                value={productDescription}
                onChange={setProductDescription}
                placeholder="Optional product description..."
              />
            </div>

            {createError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                Product created successfully!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!name.trim()) {
                  setError('Name is required.')
                  return
                }
                if (!categoryId) {
                  setError('Please select a category.')
                  return
                }
                if (!basePrice || !costPrice) {
                  setError('Base price and cost price are required.')
                  return
                }
                setError('')
                setCreateError('')
                setCreateSuccess(false)
                setIsCreating(true)
                try {
                  await api.post('/products', {
                    name,
                    category_id: categoryId,
                    base_price: parseFloat(basePrice),
                    cost_price: parseFloat(costPrice),
                    product_type: productType,
                  })
                  setCreateSuccess(true)
                  fetchProducts(1, pageSizeRef.current)
                  setTimeout(() => setFormOpen(false), 800)
                } catch (err) {
                  setCreateError(parseApiError(err) || 'Failed to create product.')
                } finally {
                  setIsCreating(false)
                }
              }}
              disabled={isCreating}
            >
              {isCreating ? 'Creating…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Product Detail / View Modal */}
      <Dialog open={viewProductModalOpen} onOpenChange={setViewProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Product Details</span>
              {viewingProduct?.id && (
                <Badge variant="outline" className="font-mono text-xs">
                  ID: #{viewingProduct.id}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="flex flex-col gap-4 text-sm">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Name</p>
                <p className="mt-1 text-base font-bold text-foreground">{viewingProduct.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Category:{' '}
                  <span className="font-medium text-foreground">
                    {viewingProduct.category?.name ||
                      categories.find((c) => c.id === viewingProduct.category_id)?.name ||
                      'Standard'}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">Base Price (₹)</span>
                  <p className="mt-1 text-base font-bold text-foreground">
                    {formatCurrency(viewingProduct.base_price)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">Cost Price (₹)</span>
                  <p className="mt-1 text-base font-bold text-foreground">
                    {formatCurrency(viewingProduct.cost_price)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">Margin</span>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(
                      (parseFloat(viewingProduct.base_price) || 0) -
                        (parseFloat(viewingProduct.cost_price) || 0)
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">Product Type</span>
                  <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                    {productTypeLabel(viewingProduct.product_type)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <span className="text-xs text-muted-foreground">Description</span>
                <p className="mt-1 text-xs text-foreground leading-relaxed">
                  {viewingProduct.description || 'No description provided for this product.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewProductModalOpen(false)
                if (viewingProduct) handleEditProduct(viewingProduct)
              }}
            >
              <Pencil className="size-3.5 mr-1" />
              Edit Product
            </Button>
            <Button size="sm" onClick={() => setViewProductModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editProductModalOpen} onOpenChange={setEditProductModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product #{editingProduct?.id}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FormField
              label="Name"
              value={editName}
              onChange={(val) => {
                setEditName(val)
                setEditError('')
              }}
              placeholder="Product name"
            />

            <div className="flex flex-col gap-1.5 text-sm">
              <label className="font-medium text-foreground">Category</label>
              <div className="relative" ref={editCategoryRef}>
                <button
                  type="button"
                  onClick={() => setEditCategoryDropdownOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-within:border-primary cursor-pointer"
                >
                  <span className={editSelectedCategory ? 'text-foreground' : 'text-muted-foreground'}>
                    {editSelectedCategory || 'Select category'}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>

                {editCategoryDropdownOpen && (
                  <div className="absolute top-full z-20 mt-1 w-full min-w-[200px] rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100">
                    <div className="border-b border-border p-2">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={editCategorySearch}
                        onChange={(e) => setEditCategorySearch(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary text-foreground"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {categories
                        .filter((c) => c.name.toLowerCase().includes(editCategorySearch.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setEditCategoryId(cat.id)
                              setEditSelectedCategory(cat.name)
                              setEditCategoryDropdownOpen(false)
                              setEditError('')
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            <span>{cat.name}</span>
                            {editCategoryId === cat.id && <Check className="size-3.5 text-primary" />}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Base Price (₹)"
                value={editBasePrice}
                onChange={setEditBasePrice}
                type="number"
                placeholder="0.00"
              />
              <FormField
                label="Cost Price (₹)"
                value={editCostPrice}
                onChange={setEditCostPrice}
                type="number"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <label className="font-medium text-foreground">Product Type</label>
              <select
                value={editProductType}
                onChange={(e) => setEditProductType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary cursor-pointer"
              >
                <option value="hardware">Hardware</option>
                <option value="service">Service</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            <FormField
              label="Description"
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Product description..."
            />

            {editError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {editError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProductModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isUpdating}
              onClick={async () => {
                if (!editName.trim()) {
                  setEditError('Name is required.')
                  return
                }
                if (!editCategoryId) {
                  setEditError('Please select a category.')
                  return
                }
                if (!editBasePrice || !editCostPrice) {
                  setEditError('Base price and cost price are required.')
                  return
                }
                setEditError('')
                setIsUpdating(true)
                try {
                  await productService.updateProduct(editingProduct.id, {
                    name: editName.trim(),
                    category_id: editCategoryId,
                    base_price: parseFloat(editBasePrice),
                    cost_price: parseFloat(editCostPrice),
                    product_type: editProductType,
                    description: editDescription.trim() || undefined,
                  })
                  toast.success(`Product "${editName}" updated successfully.`, 'Product Updated')
                  setEditProductModalOpen(false)
                  fetchProducts(currentPage, pageSizeRef.current)
                } catch (err) {
                  setEditError(parseApiError(err) || 'Failed to update product.')
                } finally {
                  setIsUpdating(false)
                }
              }}
            >
              {isUpdating ? 'Updating…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirm Dialog */}
      <ConfirmDialog
        open={deleteProductConfirmOpen}
        onOpenChange={setDeleteProductConfirmOpen}
        title={`Delete "${deletingProduct?.name}"?`}
        description="Are you sure you want to delete this product? This will permanently remove it from the catalog."
        onConfirm={async () => {
          if (!deletingProduct?.id) return
          setIsDeleting(true)
          try {
            await productService.deleteProduct(deletingProduct.id)
            toast.success(`Product "${deletingProduct.name}" deleted.`, 'Product Deleted')
            fetchProducts(currentPage, pageSizeRef.current)
          } catch (err) {
            toast.error(parseApiError(err) || 'Failed to delete product.', 'Delete Error')
          } finally {
            setIsDeleting(false)
            setDeleteProductConfirmOpen(false)
          }
        }}
      />
    </main>
  )
}

export default AdminScreen
