'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable, SectionHeader, StatusBadge, Toolbar } from './dealflow-ui'
import { useWorkspace } from './workspace-context'
import quotationService, { formatQuotationStatus, QUOTATION_STATUS_LABELS } from '../../services/quotationService'
import productService from '../../services/productService'
import { getWarehouses } from '../../services/warehouseService'
import { parseApiError } from '../../utils/errorHandler'
import { formatCurrency } from '../../utils/formatters'

export function SalesWorkspace({ onNewQuote, onViewQuotation }) {
  const { search, setSearch } = useWorkspace()
  const [stage, setStage] = useState('All stages')

  const [rawQuotations, setRawQuotations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch real backend data
  const fetchSalesData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [quoteList, productList, warehouseList] = await Promise.all([
        quotationService.getQuotations({ limit: 100 }),
        productService.getProducts({ limit: 100 }).catch(() => []),
        getWarehouses({ limit: 100 }).catch(() => []),
      ])
 
      const prodMap = (productList || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      const normalized = (quoteList || []).map((q) =>
        quotationService.normalizeQuotation(q, prodMap, {})
      )

      setRawQuotations(normalized)
      setWarehouses(warehouseList || [])
    } catch (err) {
      setError(parseApiError(err) || 'Failed to fetch live sales workspace data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  // Calculate dynamic pipeline metrics strictly from real backend quotations
  const pipelineMetrics = useMemo(() => {
    const totalCount = rawQuotations.length

    const getStageMetrics = (statusKey, label) => {
      const matching = rawQuotations.filter(
        (q) => q.status === statusKey || q.stage === label
      )
      const count = matching.length
      const amount = Math.max(
        0,
        matching.reduce((acc, q) => acc + Math.max(0, Number(q.total) || 0), 0)
      )
      return { label, statusKey, count, amount }
    }

    const stages = [
      getStageMetrics('draft', 'Draft'),
      getStageMetrics('pending_approval', 'Pending Approval'),
      getStageMetrics('negotiating', 'Negotiating'),
      getStageMetrics('approved', 'Approved'),
      getStageMetrics('confirmed', 'Confirmed'),
    ]

    const totalPipelineValue = Math.max(
      0,
      rawQuotations.reduce((acc, q) => acc + Math.max(0, Number(q.total) || 0), 0)
    )

    return {
      totalCount,
      totalPipelineValue,
      stages,
    }
  }, [rawQuotations])

  // Warehouse stock summary calculated from real warehouses
  const warehouseSummary = useMemo(() => {
    if (!warehouses || warehouses.length === 0) return null
    const totalCap = Math.max(
      0,
      warehouses.reduce((acc, w) => acc + Math.max(0, Number(w.max_q) || 0), 0)
    )
    const totalStock = Math.max(
      0,
      warehouses.reduce((acc, w) => acc + Math.max(0, Number(w.total_quantity) || 0), 0)
    )
    return {
      totalWarehouses: warehouses.length,
      totalCapacity: totalCap,
      totalStock,
      utilization: totalCap > 0 ? Math.min(100, Math.max(0, (totalStock / totalCap) * 100)).toFixed(1) : '0',
    }
  }, [warehouses])

  // Filter deals table by search & stage
  const filteredDeals = useMemo(() => {
    return rawQuotations.filter((q) => {
      const query = search.toLowerCase()
      const matchesSearch =
        q.quote.toLowerCase().includes(query) ||
        q.customer.toLowerCase().includes(query) ||
        q.salesRep.toLowerCase().includes(query) ||
        (q.stage || '').toLowerCase().includes(query)

      const matchesStage =
        stage === 'All stages' ||
        q.stage === stage ||
        q.status === stage ||
        formatQuotationStatus(q.status) === stage

      return matchesSearch && matchesStage
    })
  }, [rawQuotations, search, stage])

  const rows = filteredDeals.map((q) => [
    q.customer,
    q.quote,
    formatCurrency(q.amount || q.total),
    q.stage || formatQuotationStatus(q.status),
    q.discount || '0%',
    q.risk || 'Low',
    q.lastUpdated || q.date,
    q.salesRep,
  ])

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 pb-12">
      {/* Header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title="Sales Workspace"
          description="Track live commercial opportunities, active quotations, and inventory availability from backend services."
          action="New Quotation"
          onAction={onNewQuote}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 p-5 md:p-8">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-center justify-between">
            <span><strong>Backend API Error:</strong> {error}</span>
            <Button size="sm" variant="outline" onClick={fetchSalesData}>
              <RefreshCw className="size-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Dynamic Pipeline Stage Cards Bar (Calculated from Real GET /quotations) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Live Commercial Pipeline</p>
              <p className="text-xs text-muted-foreground">
                Click any stage card to filter open opportunities.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStage('All stages')
                setSearch('')
                fetchSalesData()
              }}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload Backend Data
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {pipelineMetrics.stages.map((item) => {
              const isSelected = stage === item.label || stage === item.statusKey
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStage(isSelected ? 'All stages' : item.label)}
                  className={`rounded-xl border bg-card p-4 text-left shadow-2xs transition hover:border-primary cursor-pointer ${
                    isSelected ? 'border-primary ring-2 ring-primary/10 bg-accent/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                    <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[11px] font-bold">
                      {item.count}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xl font-bold tracking-tight text-foreground">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Total stage value</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dashboard Grid: Active Deals + Warehouse Summary */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Active Commercial Deals</h2>
                <p className="text-xs text-muted-foreground">
                  {stage === 'All stages' ? `All ${rawQuotations.length} live records` : `${stage} deals`}
                </p>
              </div>
              {stage !== 'All stages' && (
                <Button variant="ghost" size="sm" onClick={() => setStage('All stages')} className="text-xs">
                  Clear stage filter
                </Button>
              )}
            </div>

            <Toolbar
              search={search}
              setSearch={setSearch}
              filters={stage !== 'All stages' ? [stage] : []}
              onClear={() => {
                setStage('All stages')
                setSearch('')
              }}
              onRemoveFilter={() => setStage('All stages')}
            />

            {loading ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Loading sales pipeline from real backend APIs...</span>
                </div>
              </div>
            ) : (
              <DataTable
                columns={[
                  'Customer',
                  'Quote ID',
                  'Total Amount',
                  'Stage',
                  'Discount',
                  'Risk',
                  'Updated',
                  'Sales Rep',
                ]}
                rows={rows}
                rawItems={filteredDeals}
                search=""
                emptyText="No deals found."
                emptyDescription="No backend quotations match your current search or stage filter."
                onViewRow={(record) => {
                  if (onViewQuotation) onViewQuotation(record)
                }}
              />
            )}
          </section>

          {/* Right Sidebar: Real KPI & Warehouse Summary */}
          <aside className="flex flex-col gap-4">
            <Card className="shadow-none border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Pipeline Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Total Opportunities</span>
                  <span className="font-bold text-foreground">{pipelineMetrics.totalCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Total Pipeline Value</span>
                  <span className="font-bold text-primary">{formatCurrency(pipelineMetrics.totalPipelineValue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Active Status Tiers</span>
                  <span className="font-medium text-foreground">5 Configured</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  KPI totals are dynamically compiled from live GET /quotations data.
                </p>
              </CardContent>
            </Card>

            {warehouseSummary && (
              <Card className="shadow-none border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="size-4 text-indigo-600" />
                    Warehouse & Stock Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Active Warehouses</span>
                    <span className="font-bold text-foreground">{warehouseSummary.totalWarehouses}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Total Stock Items</span>
                    <span className="font-bold text-foreground">{warehouseSummary.totalStock.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Total Max Capacity</span>
                    <span className="font-bold text-foreground">{warehouseSummary.totalCapacity.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Capacity Utilization</span>
                    <span className="font-bold text-emerald-600">{warehouseSummary.utilization}%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default SalesWorkspace
