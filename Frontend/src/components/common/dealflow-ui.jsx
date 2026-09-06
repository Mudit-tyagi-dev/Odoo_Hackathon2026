'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TableActionMenu } from './table-action-menu'

export function StatusBadge({ value }) {
  const tone = (value || '').toLowerCase()
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs',
        tone.includes('high') || tone.includes('risk')
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
          : tone.includes('medium') || tone.includes('watch') || tone.includes('approval')
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
          : tone.includes('active') ||
            tone.includes('low') ||
            tone.includes('healthy') ||
            tone.includes('completed')
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground border-border'
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
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="size-4" />
          {action}
        </Button>
      )}
    </div>
  )
}

export function Toolbar({
  search,
  setSearch,
  filters = [],
  onClear,
  onRemoveFilter,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  sortOptions = [],
  activeFilter = 'all',
  setActiveFilter,
  filterOptions = [],
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers, quotes, products, owners..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {sortOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <SlidersHorizontal className="size-3.5" />
                Sort <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    if (sortBy === option.value) {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy(option.value)
                      setSortDirection('asc')
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between cursor-pointer',
                    sortBy === option.value && 'font-semibold bg-accent text-accent-foreground'
                  )}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <span className="text-xs font-bold text-primary">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {filterOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="size-3.5" />
                Category
                {activeFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                    1
                  </Badge>
                )}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-60 overflow-y-auto">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  className={cn(
                    'flex items-center justify-between cursor-pointer',
                    activeFilter === option.value && 'font-semibold bg-accent text-accent-foreground'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {activeFilter === option.value && <Check className="size-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Reload data"
          onClick={onClear}
          title="Reset filters and reload"
          className="size-9 rounded-lg"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {(filters.length > 0 || activeFilter !== 'all' || search) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">
            Filters:
          </span>
          {activeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1.5 text-xs py-0.5">
              <span>Category: {activeFilter}</span>
              <button
                aria-label="Clear category filter"
                onClick={() => setActiveFilter && setActiveFilter('all')}
                className="cursor-pointer hover:opacity-80"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="gap-1.5 text-xs py-0.5">
              <span>Search: "{search}"</span>
              <button
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="cursor-pointer hover:opacity-80"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {filters.map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1.5 text-xs py-0.5">
              <span>{filter}</span>
              <button
                aria-label={`Remove ${filter}`}
                onClick={onRemoveFilter ? () => onRemoveFilter(filter) : onClear}
                className="cursor-pointer hover:opacity-80"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="link"
            size="sm"
            className="h-auto px-1.5 text-xs text-primary cursor-pointer hover:underline"
            onClick={onClear}
          >
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

export function DataTable({
  columns,
  rows,
  search,
  emptyText = 'No records found.',
  emptyDescription = 'This configuration will sync with backend when available.',
  onEditRow,
  onDeleteRow,
}) {
  const visible = rows.filter((row) =>
    row.join(' ').toLowerCase().includes((search || '').toLowerCase())
  )

  return (
    <Card className="shadow-none border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {column}
                  </th>
                ))}
                <th className="w-12 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => (
                <tr
                  key={`${row[0]}-${index}`}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="whitespace-nowrap px-4 py-3 text-foreground">
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
                  <td className="px-4 py-3 text-right">
                    <TableActionMenu
                      record={row}
                      onEdit={onEditRow ? () => onEditRow(row) : undefined}
                      onDelete={onDeleteRow ? () => onDeleteRow(row) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2.5 p-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-5 opacity-60" />
              </div>
              <p className="text-sm font-semibold text-foreground">{emptyText}</p>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {search ? 'Try adjusting your search query or filters.' : emptyDescription}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingTable() {
  return (
    <Card className="shadow-none border-border">
      <CardContent className="flex flex-col gap-3 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  )
}

export function FormField({ label, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
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
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 dark:border-emerald-800/60 dark:bg-emerald-950/40 p-3 text-sm text-emerald-800 dark:text-emerald-300">
      <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      {children}
    </div>
  )
}

export default DataTable
