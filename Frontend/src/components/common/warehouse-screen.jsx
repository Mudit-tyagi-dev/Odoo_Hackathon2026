'use client'

/**
 * Warehouse Management Screens
 *
 * Provides three views used by DealFlowShell's RoutedContent:
 *   WarehouseList   – /warehouses
 *   WarehouseDetail – /warehouses/:id
 *   WarehouseForm   – /warehouses/new  |  /warehouses/:id/edit
 *
 * All data comes from the real backend via warehouseService.
 * Frontend-only calculations: utilization, available capacity.
 * No DELETE UI — backend has no DELETE /warehouses endpoint.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  calcCapacity,
  parseWarehouseValidationError,
} from '../../services/warehouseService'
import { parseApiError } from '../../utils/errorHandler'
import { TableActionMenu } from './table-action-menu'
import { formatNumber } from '../../utils/formatters'

// ─────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────

function UtilizationBar({ value }) {
  const pct = Math.min(100, Math.max(0, value))
  const color =
    pct >= 90
      ? 'bg-rose-500'
      : pct >= 70
      ? 'bg-amber-500'
      : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function UtilizationBadge({ value }) {
  const pct = Math.min(100, Math.max(0, value))
  if (pct >= 90)
    return (
      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-xs">
        Critical
      </Badge>
    )
  if (pct >= 70)
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
        High
      </Badge>
    )
  return (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
      Healthy
    </Badge>
  )
}

function ErrorNotice({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="size-8 text-destructive/60" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load data</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 1. WAREHOUSE LIST
// ─────────────────────────────────────────────

const PAGE_SIZE = 10

export function WarehouseList({ onNavigate }) {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0) // 0-based

  const fetchPage = useCallback(async (pageIndex) => {
    setLoading(true)
    setError('')
    try {
      const data = await getWarehouses({ skip: pageIndex * PAGE_SIZE, limit: PAGE_SIZE })
      setWarehouses(data)
      setPage(pageIndex)
    } catch (err) {
      setError(parseApiError(err) || 'Failed to load warehouses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(0)
  }, [fetchPage])

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const hasPrevPage = page > 0
  const hasNextPage = warehouses.length === PAGE_SIZE

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Page header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Warehouses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage stock locations and monitor fulfillment capacity.
            </p>
          </div>
          <Button
            id="add-warehouse-btn"
            onClick={() => onNavigate('/warehouses/new')}
            className="gap-2"
          >
            <Plus className="size-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 p-5 md:p-8">
        {/* Search bar */}
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                id="warehouse-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or address…"
                className="pl-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh warehouses"
              onClick={() => fetchPage(page)}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorNotice message={error} onRetry={() => fetchPage(page)} />
        ) : filtered.length === 0 ? (
          <Card className="shadow-none">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
              <Warehouse className="size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">
                {search ? 'No warehouses match your search.' : 'No warehouses yet.'}
              </p>
              <p className="text-xs text-muted-foreground">
                {search
                  ? 'Try a different search term.'
                  : 'Click "Add Warehouse" to create the first one.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Warehouse</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Address</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Maximum Capacity</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Current Quantity</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Utilization</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                      <th className="w-28 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w) => {
                      const { utilization, available } = calcCapacity(w)
                      return (
                        <tr
                          key={w.id}
                          className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                          onClick={() => onNavigate(`/warehouses/${w.id}`)}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Building2 className="size-3.5" />
                              </div>
                              <span className="font-medium">{w.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground text-xs">
                            {w.address || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {(w.max_q ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {(w.total_quantity ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <UtilizationBar value={utilization} />
                          </td>
                          <td className="px-4 py-3.5">
                            <UtilizationBadge value={utilization} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-medium"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onNavigate(`/warehouses/${w.id}`)
                                }}
                              >
                                View
                              </Button>
                              <TableActionMenu
                                record={w}
                                onEdit={() => onNavigate(`/warehouses/${w.id}/edit`)}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {loading
              ? 'Loading…'
              : `Showing ${filtered.length} of ${warehouses.length} records`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage || loading}
              onClick={() => fetchPage(page - 1)}
              className="gap-1.5"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <span className="px-1">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage || loading}
              onClick={() => fetchPage(page + 1)}
              className="gap-1.5"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────
// 2. WAREHOUSE DETAIL
// ─────────────────────────────────────────────

export function WarehouseDetail({ warehouseId, onNavigate, onBack, onWarehouseLoaded }) {
  const [warehouse, setWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchWarehouse = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getWarehouse(warehouseId)
      setWarehouse(data)
      if (onWarehouseLoaded && data?.name) {
        onWarehouseLoaded(data.name)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('Warehouse not found.')
      } else {
        setError(parseApiError(err) || 'Failed to load warehouse.')
      }
    } finally {
      setLoading(false)
    }
  }, [warehouseId, onWarehouseLoaded])

  useEffect(() => {
    fetchWarehouse()
  }, [fetchWarehouse])

  if (loading) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-4xl p-5 md:p-8 flex flex-col gap-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-4xl p-5 md:p-8">
          <ErrorNotice message={error} onRetry={fetchWarehouse} />
          <Button variant="ghost" className="mt-4 gap-2" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back to Warehouses
          </Button>
        </div>
      </main>
    )
  }

  if (!warehouse) return null

  const { utilization, utilizationPct, available } = calcCapacity(warehouse)

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={onBack}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                Warehouses
              </button>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{warehouse.name}</h2>
            {warehouse.address && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {warehouse.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              id="add-inventory-btn"
              onClick={() => onNavigate(`/admin/warehouses/${warehouse.id}/inventory/add`)}
              className="gap-2"
            >
              <Plus className="size-4" />
              Add Inventory
            </Button>
            <Button
              id="edit-warehouse-btn"
              variant="outline"
              onClick={() => onNavigate(`/admin/warehouses/${warehouse.id}/edit`)}
              className="gap-2"
            >
              <Edit3 className="size-4" />
              Edit Warehouse
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl flex flex-col gap-5 p-5 md:p-8">
        {/* Capacity cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CapacityCard
            label="Maximum Capacity"
            value={(warehouse.max_q ?? 0).toLocaleString()}
            icon={<Warehouse className="size-4" />}
            tone="blue"
          />
          <CapacityCard
            label="Current Quantity"
            value={(warehouse.total_quantity ?? 0).toLocaleString()}
            icon={<Package className="size-4" />}
            tone={utilization >= 90 ? 'red' : utilization >= 70 ? 'amber' : 'green'}
          />
          <CapacityCard
            label="Available Capacity"
            value={available.toLocaleString()}
            icon={<PackageCheck className="size-4" />}
            tone="green"
          />
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Utilization</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold tabular-nums leading-none">
                  {utilizationPct}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    utilization >= 90
                      ? 'bg-rose-500'
                      : utilization >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>
              <div className="mt-2">
                <UtilizationBadge value={utilization} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products table */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center">
              Products in Warehouse
              <Badge variant="secondary" className="ml-2">
                {(warehouse.products || []).length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate(`/admin/warehouses/${warehouse.id}/inventory/add`)}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="size-3.5" />
              Add Inventory
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(!warehouse.products || warehouse.products.length === 0) ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center">
                <Package className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No products assigned</p>
                <p className="text-xs text-muted-foreground">
                  No stock has been added to this warehouse yet.
                </p>
                <Button
                  size="sm"
                  onClick={() => onNavigate(`/admin/warehouses/${warehouse.id}/inventory/add`)}
                  className="mt-2 gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add First Inventory
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Product ID</th>
                      <th className="px-4 py-3 font-medium">Product Name</th>
                      <th className="px-4 py-3 font-medium">Warehouse</th>
                      <th className="px-4 py-3 font-medium text-right">Quantity</th>
                      <th className="w-24 px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouse.products.map((p) => (
                      <tr key={p.product_id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          #{p.product_id}
                        </td>
                        <td className="px-4 py-3 font-medium">{p.product_name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.warehouse_name || warehouse.name}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {(p.quantity ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium"
                              onClick={() =>
                                onNavigate(
                                  `/admin/warehouses/${warehouse.id}/inventory/add?product_id=${p.product_id}`
                                )
                              }
                            >
                              Update
                            </Button>
                            <TableActionMenu
                              record={p}
                              onEdit={() =>
                                onNavigate(
                                  `/admin/warehouses/${warehouse.id}/inventory/add?product_id=${p.product_id}`
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function CapacityCard({ label, value, icon, tone }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
  }[tone] || 'bg-muted text-muted-foreground'

  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className={cn('flex size-7 items-center justify-center rounded-md', toneClass)}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 3. WAREHOUSE FORM (Create + Edit)
// ─────────────────────────────────────────────

export function WarehouseForm({ warehouseId, onNavigate, onBack, onWarehouseLoaded }) {
  const isEdit = Boolean(warehouseId)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [maxQ, setMaxQ] = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(isEdit)

  // Load existing data when editing
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoadingExisting(true)
    getWarehouse(warehouseId)
      .then((data) => {
        if (cancelled) return
        setName(data.name || '')
        setAddress(data.address || '')
        setMaxQ(data.max_q != null ? String(data.max_q) : '')
        if (onWarehouseLoaded && data?.name) {
          onWarehouseLoaded(data.name)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setSubmitError(parseApiError(err) || 'Failed to load warehouse data.')
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, warehouseId])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (maxQ !== '' && maxQ !== undefined) {
      const num = Number(maxQ)
      if (isNaN(num) || num < 1) errs.max_q = 'Maximum capacity must be a positive integer.'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setSubmitError('')
    setSubmitSuccess(false)

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        ...(maxQ !== '' ? { max_q: Number(maxQ) } : {}),
      }

      let result
      if (isEdit) {
        result = await updateWarehouse(warehouseId, payload)
      } else {
        result = await createWarehouse(payload)
      }

      setSubmitSuccess(true)

      // Navigate to detail after short delay
      setTimeout(() => {
        onNavigate(`/warehouses/${result.id}`)
      }, 800)
    } catch (err) {
      // Try to parse field-level errors from FastAPI 422
      const fieldErrs = parseWarehouseValidationError(err)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
      } else {
        setSubmitError(parseApiError(err) || `Failed to ${isEdit ? 'update' : 'create'} warehouse.`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={onBack}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                {isEdit ? 'Warehouse' : 'Warehouses'}
              </button>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Edit Warehouse' : 'Create Warehouse'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? 'Update warehouse details. Current quantity is managed by inventory.'
                : 'Add a new stock location. Current quantity is managed by inventory.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-5 md:p-8">
        {loadingExisting ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Card className="shadow-none">
              <CardContent className="flex flex-col gap-5 p-6">
                {/* Name */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <label htmlFor="wh-name" className="font-medium">
                    Warehouse Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="wh-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    placeholder="e.g. Main Delhi Warehouse"
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={fieldErrors.name ? 'border-destructive' : ''}
                  />
                  {fieldErrors.name && (
                    <span className="text-xs text-destructive">{fieldErrors.name}</span>
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <label htmlFor="wh-address" className="font-medium">
                    Address
                  </label>
                  <Input
                    id="wh-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, address: undefined }))
                    }}
                    placeholder="e.g. Gandhinagar, Gujarat"
                    aria-invalid={Boolean(fieldErrors.address)}
                    className={fieldErrors.address ? 'border-destructive' : ''}
                  />
                  {fieldErrors.address && (
                    <span className="text-xs text-destructive">{fieldErrors.address}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Defaults to "Gandhinagar, Gujarat" if left empty.
                  </span>
                </div>

                {/* Maximum Capacity (max_q) */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <label htmlFor="wh-max-q" className="font-medium">
                    Maximum Capacity
                  </label>
                  <Input
                    id="wh-max-q"
                    type="number"
                    min="1"
                    step="1"
                    value={maxQ}
                    onChange={(e) => {
                      setMaxQ(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, max_q: undefined }))
                    }}
                    placeholder="e.g. 10000"
                    aria-invalid={Boolean(fieldErrors.max_q)}
                    className={fieldErrors.max_q ? 'border-destructive' : ''}
                  />
                  {fieldErrors.max_q && (
                    <span className="text-xs text-destructive">{fieldErrors.max_q}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Total units this warehouse can hold. Defaults to 500 if left empty.
                  </span>
                </div>

                {/* Info box: read-only fields */}
                {isEdit && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                    <p className="font-medium mb-0.5">Current quantity is read-only</p>
                    <p className="text-blue-700">
                      The current stock quantity is calculated by the backend from product inventory and cannot be edited here.
                    </p>
                  </div>
                )}

                {/* Error */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    {submitError}
                  </div>
                )}

                {/* Success */}
                {submitSuccess && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 flex items-center gap-2">
                    <span className="size-4">✓</span>
                    Warehouse {isEdit ? 'updated' : 'created'} successfully! Redirecting…
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="gap-2 min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isEdit ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  isEdit ? 'Save Changes' : 'Create Warehouse'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export { AddInventoryScreen } from './warehouse-inventory-screen'
export default WarehouseList
