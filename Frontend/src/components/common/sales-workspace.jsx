'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileCheck2,
  Plus,
  RefreshCw,
  Truck,
  WalletCards,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { deals, stageData } from './dealflow-data'
import { DataTable, SectionHeader, StatusBadge, Toolbar } from './dealflow-ui'
import { useWorkspace } from './workspace-context'

export function SalesWorkspace({ onNewQuote }) {
  const { search, setSearch } = useWorkspace()
  const [stage, setStage] = useState('All stages')

  const filtered = useMemo(
    () =>
      deals.filter(
        (deal) =>
          (stage === 'All stages' || deal.stage === stage) &&
          `${deal.customer} ${deal.quote} ${deal.owner}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [search, stage]
  )

  const rows = filtered.map((deal) => [
    deal.customer,
    deal.quote,
    deal.amount,
    deal.stage,
    deal.discount,
    deal.risk,
    deal.activity,
    deal.owner,
  ])

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title="Sales Workspace"
          description="Move the deals that need your attention forward."
          action="New Quotation"
          onAction={onNewQuote}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 p-5 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Deal pipeline</p>
            <p className="text-xs text-muted-foreground">Click a stage to filter active deals.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setStage('All stages'); setSearch(''); }}>
            <RefreshCw data-icon="inline-start" />
            Reload data
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stageData.map((item) => (
            <button
              key={item.label}
              onClick={() => setStage(item.label)}
              className={`rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary cursor-pointer ${
                stage === item.label ? 'border-primary ring-2 ring-primary/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
              <p className="mt-3 text-xl font-semibold">{item.amount}</p>
              <p className="mt-1 text-xs text-muted-foreground">total amount</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Active deals</h2>
                <p className="text-sm text-muted-foreground">
                  {stage === 'All stages' ? 'All open opportunities' : `${stage} deals`}
                </p>
              </div>
              {stage !== 'All stages' && (
                <Button variant="ghost" size="sm" onClick={() => setStage('All stages')}>
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
            />

            <DataTable
              columns={[
                'Customer',
                'Quote',
                'Amount',
                'Stage',
                'Discount',
                'Risk',
                'Last activity',
                'Sales rep',
              ]}
              rows={rows}
              search=""
              emptyText="No deals match this view."
            />
          </section>

          <AttentionPanel onSelectAttention={onNewQuote} />
        </div>
      </div>
    </main>
  )
}

function AttentionPanel({ onSelectAttention }) {
  const items = [
    {
      label: 'Approval pending',
      detail: 'Apex Manufacturing · QT-2048',
      icon: FileCheck2,
    },
    {
      label: 'High-risk discount',
      detail: 'BluePeak Energy · QT-2035',
      icon: AlertTriangle,
    },
    {
      label: 'Delivery issue',
      detail: 'Vertex Systems · QT-2039',
      icon: Truck,
    },
    {
      label: 'Billing issue',
      detail: 'Cobalt Health · QT-2028',
      icon: WalletCards,
    },
  ]

  return (
    <Card className="h-fit shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Attention required</CardTitle>
        <p className="text-xs text-muted-foreground">Actionable items across your book.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map(({ label, detail, icon: Icon }) => (
          <button
            key={label}
            onClick={onSelectAttention}
            className="flex items-start gap-3 rounded-md p-3 text-left hover:bg-muted cursor-pointer transition"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{label}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">{detail}</span>
            </span>
            <ArrowRight className="ml-auto mt-1 size-4 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

export default SalesWorkspace
