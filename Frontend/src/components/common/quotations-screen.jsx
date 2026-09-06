import { useState, useEffect, useMemo, useCallback } from 'react'
import { Edit3, Eye, FilePlus2, MoreHorizontal, Send, Trash2, X, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, BarChart2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog, SectionHeader, StatusBadge, Toolbar } from './dealflow-ui'
import { TableActionMenu } from './table-action-menu'
import { formatCurrency } from '../../utils/formatters'
import { useWorkspace } from './workspace-context'
import quotationService, { formatQuotationStatus, QUOTATION_STATUS_LABELS } from '../../services/quotationService'
import productService from '../../services/productService'
import subscriptionService from '../../services/subscriptionService'
import { parseApiError } from '../../utils/errorHandler'
import { useToast } from '@/components/ui/Toast'

export function QuotationsScreen({ onNewQuote, onViewQuotation }) {
  const { search, setSearch } = useWorkspace()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rawQuotations, setRawQuotations] = useState([])
  const [quotationsLoading, setQuotationsLoading] = useState(false)
  const [quotationsError, setQuotationsError] = useState('')

  // Fetch real backend quotations from GET /quotations
  const fetchQuotations = useCallback(async () => {
    setQuotationsLoading(true)
    setQuotationsError('')
    try {
      const [quoteList, productList, planList] = await Promise.all([
        quotationService.getQuotations({ limit: 100 }),
        productService.getProducts({ limit: 100 }).catch(() => []),
        subscriptionService.getSubscriptionPlans().catch(() => []),
      ])

      const prodMap = (productList || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      const planMap = (planList || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})

      const normalized = (quoteList || []).map((q) =>
        quotationService.normalizeQuotation(q, prodMap, planMap)
      )

      setRawQuotations(normalized)
    } catch (err) {
      setQuotationsError(parseApiError(err) || 'Failed to fetch quotations from backend server.')
    } finally {
      setQuotationsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const rows = useMemo(() => {
    return rawQuotations.filter((row) => {
      const q = search.toLowerCase()
      const matchesSearch =
        row.quote.toLowerCase().includes(q) ||
        row.customer.toLowerCase().includes(q) ||
        row.salesRep.toLowerCase().includes(q) ||
        (row.stage || '').toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'all' ||
        row.status === statusFilter ||
        row.stage === statusFilter ||
        row.stage === QUOTATION_STATUS_LABELS[statusFilter]

      return matchesSearch && matchesStatus
    })
  }, [rawQuotations, search, statusFilter])

  // Calculate Quotation KPIs & Status distribution from real quotation data
  const kpis = useMemo(() => {
    const totalCount = rawQuotations.length
    
    // Status counts
    const pendingApproval = rawQuotations.filter(
      (q) => q.status === 'pending_approval' || q.stage === 'Pending Approval'
    ).length

    const approved = rawQuotations.filter(
      (q) => q.status === 'approved' || q.stage === 'Approved'
    ).length

    const negotiating = rawQuotations.filter(
      (q) => q.status === 'negotiating' || q.stage === 'Negotiating'
    ).length

    const confirmed = rawQuotations.filter(
      (q) => q.status === 'confirmed' || q.stage === 'Confirmed'
    ).length

    const draft = rawQuotations.filter(
      (q) => q.status === 'draft' || q.stage === 'Draft'
    ).length

    const totalValue = rawQuotations.reduce((acc, q) => acc + (Number(q.total) || 0), 0)

    return {
      totalCount,
      pendingApproval,
      approved,
      negotiating,
      confirmed,
      draft,
      totalValue,
    }
  }, [rawQuotations])

  const apiSyncLabel = 'Live Backend Data'

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 pb-12">
      {/* Header */}
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title="Quotations"
          description="Create, review, negotiate, and track commercial proposals across all lifecycle stages."
          action="New Quotation"
          onAction={onNewQuote}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 p-5 md:p-8">
        {quotationsError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-center justify-between">
            <span><strong>API Error:</strong> {quotationsError}</span>
            <Button size="sm" variant="outline" onClick={fetchQuotations}>
              <RefreshCw className="size-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* KPI Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <p className="text-xs text-muted-foreground font-medium">Total Quotations</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{kpis.totalCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Real API Count</p>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
            <p className="text-xs text-amber-800 font-medium">Pending Approval</p>
            <p className="text-2xl font-bold tracking-tight text-amber-900 mt-1">{kpis.pendingApproval}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Awaiting Review</p>
          </div>

          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-2xs">
            <p className="text-xs text-indigo-800 font-medium">Negotiating</p>
            <p className="text-2xl font-bold tracking-tight text-indigo-900 mt-1">{kpis.negotiating}</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">Counter-Offers</p>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs">
            <p className="text-xs text-emerald-800 font-medium">Approved</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-900 mt-1">{kpis.approved}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Ready for Client</p>
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-2xs">
            <p className="text-xs text-blue-800 font-medium">Confirmed Orders</p>
            <p className="text-2xl font-bold tracking-tight text-blue-900 mt-1">{kpis.confirmed}</p>
            <p className="text-[11px] text-blue-700 mt-0.5">Conversion Complete</p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <p className="text-xs text-muted-foreground font-medium">Total Pipeline Value</p>
            <p className="text-xl font-bold tracking-tight text-primary mt-1">{formatCurrency(kpis.totalValue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">INR (₹)</p>
          </div>
        </div>

        {/* Minimal Status Distribution Progress Bar Chart */}
        {kpis.totalCount > 0 && (
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="size-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Pipeline Status Distribution</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">{apiSyncLabel}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
                <div
                  className="bg-slate-400 h-full transition-all duration-300"
                  style={{ width: `${(kpis.draft / kpis.totalCount) * 100}%` }}
                  title={`Draft: ${kpis.draft}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(kpis.pendingApproval / kpis.totalCount) * 100}%` }}
                  title={`Pending Approval: ${kpis.pendingApproval}`}
                />
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(kpis.negotiating / kpis.totalCount) * 100}%` }}
                  title={`Negotiating: ${kpis.negotiating}`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(kpis.approved / kpis.totalCount) * 100}%` }}
                  title={`Approved: ${kpis.approved}`}
                />
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(kpis.confirmed / kpis.totalCount) * 100}%` }}
                  title={`Confirmed: ${kpis.confirmed}`}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-slate-400" />
                  <span>Draft ({kpis.draft})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  <span>Pending Approval ({kpis.pendingApproval})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-indigo-500" />
                  <span>Negotiating ({kpis.negotiating})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span>Approved ({kpis.approved})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-blue-600" />
                  <span>Confirmed ({kpis.confirmed})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toolbar & Filter Bar */}
        <Toolbar
          search={search}
          setSearch={setSearch}
          onClear={() => setSearch('')}
        />

        {/* Table */}
        <Card className="shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground font-semibold">
                    {[
                      'Quote ID',
                      'Customer',
                      'Amount (₹)',
                      'Discount',
                      'Risk Assessment',
                      'Lifecycle Stage',
                      'Owner',
                      'Updated',
                      'Actions',
                    ].map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotationsLoading ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-xs text-muted-foreground">
                        <div className="flex items-center justify-center gap-2 animate-pulse">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span>Fetching live quotations from GET /quotations API...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-xs text-muted-foreground">
                        No real quotations found in backend server matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.quote} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-medium font-mono text-slate-900">{row.quote}</td>
                        <td className="px-4 py-3.5 font-medium">{row.customer}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-3.5 text-emerald-700 dark:text-emerald-400 font-medium">{row.discount}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge value={row.risk} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge value={row.status || row.stage} />
                        </td>
                        <td className="px-4 py-3.5">{row.owner}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                          {row.updated}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`View quotation ${row.quote}`}
                              onClick={() => onViewQuotation ? onViewQuotation(row) : onNewQuote && onNewQuote()}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Submit quotation ${row.quote}`}
                              onClick={async () => {
                                if (!row.rawId) return
                                setSelected(row)
                                setConfirm(true)
                              }}
                              disabled={row.status !== 'draft'}
                              title={row.status !== 'draft' ? `Cannot submit: status is ${row.status}` : 'Submit for approval'}
                            >
                              <Send />
                            </Button>
                            <TableActionMenu
                              record={row}
                              onEdit={() => onViewQuotation ? onViewQuotation(row) : null}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {rows.length} of {rawQuotations.length} real backend quotations</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchQuotations} disabled={quotationsLoading}>
              <RefreshCw className="size-3.5 mr-1" />
              Refresh API
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Submit ${selected?.quote || selected} for approval?`}
        description="The quotation will be submitted to the approval queue. You can still view it but cannot edit it while pending."
        onConfirm={async () => {
          const row = selected
          if (!row?.rawId) {
            setConfirm(false)
            return
          }
          setIsSubmitting(true)
          try {
            await quotationService.submitQuotation(row.rawId)
            toast.success(`Quotation ${row.quote} submitted for approval.`, 'Submitted')
            await fetchQuotations()
          } catch (err) {
            toast.error(parseApiError(err) || 'Failed to submit quotation.', 'Error')
          } finally {
            setIsSubmitting(false)
            setConfirm(false)
            setSelected(null)
          }
        }}
      />
    </main>
  )
}

export default QuotationsScreen
