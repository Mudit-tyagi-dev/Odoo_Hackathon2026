'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function StatusBadge({ value }) {
  const tone = (value || '').toLowerCase()
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs',
        tone.includes('high') || tone.includes('risk')
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : tone.includes('medium') || tone.includes('watch') || tone.includes('approval')
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : tone.includes('active') ||
            tone.includes('low') ||
            tone.includes('healthy') ||
            tone.includes('completed')
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'bg-muted/50 text-muted-foreground'
      )}
    >
      {value}
    </Badge>
  )
}

export function SectionHeader({ title, description, action, onAction }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button onClick={onAction}>
          <Plus data-icon="inline-start" />
          {action}
        </Button>
      )}
    </div>
  )
}

export function Toolbar({ search, setSearch, filters = [], onClear }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers, quotes, products, owners..."
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter data-icon="inline-start" />
          Filters <Badge variant="secondary" className="ml-1">{filters.length || 3}</Badge>
        </Button>
        <Button variant="outline">
          <SlidersHorizontal data-icon="inline-start" />
          Sort <ChevronDown data-icon="inline-end" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Reload data" onClick={onClear}>
          <RefreshCw />
        </Button>
      </div>
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {filters.length} filters applied
          </span>
          {filters.map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
              <button aria-label={`Remove ${filter}`} onClick={onClear} className="cursor-pointer">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="link" size="sm" className="h-auto px-1 cursor-pointer" onClick={onClear}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DataTable({ columns, rows, search, emptyText = 'No records found.' }) {
  const visible = rows.filter((row) =>
    row.join(' ').toLowerCase().includes((search || '').toLowerCase())
  )

  return (
    <Card className="shadow-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/25 text-left text-xs text-muted-foreground">
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => (
                <tr key={`${row[0]}-${index}`} className="border-b last:border-0 hover:bg-muted/20">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="whitespace-nowrap px-4 py-3.5">
                      {cellIndex === row.length - 1 ||
                      [
                        'Active',
                        'Draft',
                        'Low',
                        'Medium',
                        'High',
                        'Healthy',
                        'Watch',
                        'Approval',
                        'Negotiation',
                        'Fulfillment',
                        'Completed',
                      ].includes(cell) ? (
                        <StatusBadge value={cell} />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-right">
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${row[0]}`}>
                      <MoreHorizontal />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Search className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{emptyText}</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingTable() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export function FormField({ label, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={error ? 'border-destructive' : ''}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}

export function SuccessNotice({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <Check className="size-4" />
      {children}
    </div>
  )
}

export default DataTable
