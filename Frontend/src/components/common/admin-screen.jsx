'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PackagePlus, Pencil, Plus, Trash2, Search, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminCollections } from './dealflow-data'
import { DataTable, FormField, SectionHeader, Toolbar } from './dealflow-ui'
import { useWorkspace } from './workspace-context'
import { useToast } from '@/components/ui/Toast'
import api from '../../services/api'
import productService from '../../services/productService'
import { parseApiError } from '../../utils/errorHandler'
import { formatCurrency } from '../../utils/formatters'

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

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')
    try {
      const data = await productService.getProducts({ skip: 0, limit: 100 })
      setProductsData(data)
    } catch (err) {
      setProductsError(parseApiError(err) || 'Failed to load products.')
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (section === 'products') {
      fetchCategories()
      fetchProducts()
    }
  }, [section, fetchCategories, fetchProducts])

  // Process rows with real search, sorting, and category filter
  const rows =
    section === 'products'
      ? productsData
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
          .map((product) => {
            const catName =
              product.category?.name ||
              categories.find((c) => c.id === product.category_id)?.name ||
              'Standard'
            return [
              product.name,
              catName,
              formatCurrency(product.base_price),
              'Each',
              'Active',
              'In stock',
            ]
          })
      : config?.rows || []

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
              columns={['Product', 'Category', 'Price', 'Unit', 'Status', 'Stock']}
              rows={rows}
              search=""
              emptyText="No products found."
              emptyDescription="No products match your current search or category filter. Click 'Clear all' to view the complete catalog."
            />
          )
        ) : (
          <DataTable
            columns={config?.columns || []}
            rows={rows}
            search={search}
            emptyText={`No ${title.toLowerCase()} configured.`}
            emptyDescription="This configuration module will synchronize with the backend once the corresponding management endpoints are available."
          />
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {rows.length} {rows.length === 1 ? 'record' : 'records'}</span>
          <span>Page 1 of 1</span>
        </div>
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
                  fetchProducts()
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
    </main>
  )
}

export default AdminScreen
