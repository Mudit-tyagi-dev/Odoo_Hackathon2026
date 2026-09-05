'use client'

import { useState, useEffect, useRef } from 'react'
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
import api from '../../services/api'
import { parseApiError } from '../../utils/errorHandler'

export function AdminScreen({ section, onAddProduct }) {
  const config = section === 'products' ? null : adminCollections[section]
  const title = config?.title ?? 'Products'
  const description =
    config?.description ?? 'Manage the product catalog used across quotations and price lists.'
  const { search, setSearch } = useWorkspace()
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
  const [selectedCategory, setSelectedCategory] = useState('Hardware')
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

  useEffect(() => {
    if (section !== 'products') return
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      setCategoryError('')
      try {
        const response = await api.get('/products/categories')
        const backendData = response.data
        const catList = backendData?.data || []
        setCategories(catList)
        if (catList.length > 0) {
          setActiveFilters(['Active', ...catList.slice(0, 3).map((c) => c.name)])
        }
      } catch (err) {
        setCategoryError(parseApiError(err) || 'Failed to load categories.')
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [section, setSearch])

  useEffect(() => {
    if (section !== 'products') return
    const fetchProducts = async () => {
      setProductsLoading(true)
      setProductsError('')
      try {
        const response = await api.get('/products?skip=0&limit=20')
        setProductsData(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setProductsError(parseApiError(err) || 'Failed to load products.')
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [section])

  const rows =
    section === 'products'
      ? productsData
          .filter((product) =>
            Object.values(product).join(' ').toLowerCase().includes(search.toLowerCase())
          )
          .filter((product) => {
            if (activeFilter === 'all') return true
            return product.category?.name === activeFilter
          })
          .sort((a, b) => {
            let aValue, bValue
            if (sortBy === 'price') {
              aValue = parseFloat(a.base_price) || 0
              bValue = parseFloat(b.base_price) || 0
            } else if (sortBy === 'category') {
              aValue = (a.category?.name || String(a.category_id)).toLowerCase()
              bValue = (b.category?.name || String(b.category_id)).toLowerCase()
            } else {
              aValue = (a.name || '').toLowerCase()
              bValue = (b.name || '').toLowerCase()
            }
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
          })
          .map((product) => [
            product.name,
            product.category?.name || product.category_id,
            `₹${product.base_price}`,
            'Each',
            'Active',
            'In stock',
          ])
      : config?.rows || []

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title={title}
          description={description}
          action={section === 'products' ? 'Add Product' : `Add ${title.slice(0, -1)}`}
          onAction={() => {
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
          filters={section === 'products' ? activeFilters : ['Active']}
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
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              Loading products…
            </div>
          ) : productsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {productsError}
            </div>
          ) : (
            <DataTable
              columns={['Product', 'Category', 'Price', 'Unit', 'Status', 'Stock']}
              rows={rows}
              search=""
            />
          )
        ) : (
          <DataTable columns={config?.columns || []} rows={rows} search={search} />
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {rows.length} records</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {section === 'products' ? 'Add product' : `Add ${title.slice(0, -1)}`}
            </DialogTitle>
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
              placeholder={section === 'products' ? 'Product name' : 'Configuration name'}
            />
            {section === 'products' ? (
              <div className="flex flex-col gap-4">
                {/* Category dropdown (dynamic) */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <label className="font-medium">Category</label>
                  <div className="relative" ref={categoryRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen((o) => !o)}
                      disabled={categoriesLoading}
                      className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-within:border-primary disabled:opacity-50"
                    >
                      <span className={selectedCategory ? '' : 'text-muted-foreground'}>
                        {selectedCategory || 'Select a category'}
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute top-full z-20 mt-1 w-full min-w-[200px] rounded-md border bg-background shadow-lg">
                        <div className="border-b p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full rounded-md border px-3 py-1.5 pl-8 text-sm outline-none focus:border-primary"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {categoriesLoading ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>
                          ) : categoryError ? (
                            <div className="px-3 py-2 text-sm text-destructive">{categoryError}</div>
                          ) : filteredCategories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No match</div>
                          ) : (
                            filteredCategories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setCategoryId(cat.id)
                                  setSelectedCategory(cat.name)
                                  setCategoryDropdownOpen(false)
                                  setCategorySearch('')
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                              >
                                <span>{cat.name}</span>
                                {selectedCategory === cat.name && (
                                  <Check className="size-4 text-emerald-600" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Base Price"
                    value={basePrice}
                    onChange={setBasePrice}
                    placeholder="0.00"
                    type="number"
                  />
                  <FormField
                    label="Cost Price"
                    value={costPrice}
                    onChange={setCostPrice}
                    placeholder="0.00"
                    type="number"
                  />
                </div>

                {/* Product type */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <label className="font-medium">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="service">Service</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                {/* Extra frontend-only fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Tax (%)"
                    value={tax}
                    onChange={setTax}
                    placeholder="0"
                    type="number"
                  />
                  <FormField
                    label="Unit"
                    value={unit}
                    onChange={setUnit}
                    placeholder="Each, Month, Project..."
                  />
                  <FormField
                    label="Quantity in hand"
                    value={quantityInHand}
                    onChange={setQuantityInHand}
                    placeholder="0"
                    type="number"
                  />
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={isSubscription}
                        onChange={(e) => setIsSubscription(e.target.checked)}
                        className="rounded border-primary text-primary focus:ring-primary"
                      />
                      <span>Is subscription item</span>
                    </label>
                  </div>
                </div>

                <FormField
                  label="Description"
                  value={productDescription}
                  onChange={setProductDescription}
                  placeholder="Optional product description..."
                />
              </div>
            ) : null}
            {createError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
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
