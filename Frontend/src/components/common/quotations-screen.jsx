'use client'

import { useState } from 'react'
import { Edit3, Eye, FilePlus2, MoreHorizontal, Send, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { quotationRows } from './dealflow-data'
import { ConfirmDialog, SectionHeader, StatusBadge, Toolbar } from './dealflow-ui'
import { TableActionMenu } from './table-action-menu'
import { formatCurrency } from '../../utils/formatters'
import { useWorkspace } from './workspace-context'

export function QuotationsScreen({ onNewQuote }) {
  const { search, setSearch } = useWorkspace()
  const [confirm, setConfirm] = useState(false)
  const [selected, setSelected] = useState('')

  const rows = quotationRows.filter(
    (row) =>
      row.quote.toLowerCase().includes(search.toLowerCase()) ||
      row.customer.toLowerCase().includes(search.toLowerCase()) ||
      row.salesRep.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
      <div className="border-b bg-card px-5 py-6 md:px-8">
        <SectionHeader
          title="Quotations"
          description="Create, review, and move customer quotations through approval."
          action="New Quotation"
          onAction={onNewQuote}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 p-5 md:p-8">
        <Toolbar
          search={search}
          setSearch={setSearch}
          // filters={['Approval pending', 'High risk', 'Gold tier']}
          onClear={() => setSearch('')}
        />

        <Card className="shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground">
                    {[
                      'Quote',
                      'Customer',
                      'Amount',
                      'Discount',
                      'Risk',
                      'Stage',
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
                  {rows.map((row) => (
                    <tr key={row.quote} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3.5 font-medium">{row.quote}</td>
                      <td className="px-4 py-3.5">{row.customer}</td>
                      <td className="px-4 py-3.5 font-medium">{row.amount}</td>
                      <td className="px-4 py-3.5">{row.discount}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge value={row.risk} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge value={row.stage} />
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
                            onClick={onNewQuote}
                          >
                            <Eye />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit quotation ${row.quote}`}
                            disabled={row.stage === 'Approval'}
                            title={
                              row.stage === 'Approval'
                                ? 'Cannot edit while approval is pending.'
                                : 'Edit'
                            }
                            onClick={onNewQuote}
                          >
                            <Edit3 />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Submit quotation ${row.quote}`}
                            onClick={() => {
                              setSelected(row.quote)
                              setConfirm(true)
                            }}
                            disabled={row.stage !== 'Draft'}
                          >
                            <Send />
                          </Button>
                          <TableActionMenu
                            record={row}
                            onEdit={onNewQuote}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No quotations match your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {rows.length} of {quotationRows.length} quotations</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Submit ${selected} for approval?`}
        description="The quotation will be locked for editing while approval is pending."
        onConfirm={() => {}}
      />
    </main>
  )
}

export default QuotationsScreen
