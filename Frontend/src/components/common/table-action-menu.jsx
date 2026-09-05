'use client'

import React from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

/**
 * Standardized three-dot action menu for all data tables in DealFlow360.
 *
 * @param {Object} props
 * @param {any} props.record - The data row/item associated with this action menu.
 * @param {Function} [props.onEdit] - Optional edit handler. If omitted, shows clean API readiness notice.
 * @param {Function} [props.onDelete] - Optional delete handler. If omitted, shows clean API readiness notice.
 * @param {string} [props.editLabel="Edit"]
 * @param {string} [props.deleteLabel="Delete"]
 * @param {string} [props.align="end"]
 * @param {string} [props.className]
 */
export function TableActionMenu({
  record,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  align = 'end',
  className = '',
}) {
  let toast = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast()
  } catch {
    // Graceful fallback if rendered outside ToastProvider
  }

  const handleActionNotice = (actionName) => {
    const message = `This action will be connected when the ${actionName.toLowerCase()} API is available.`
    if (toast?.info) {
      toast.info(message, 'API Notice')
    } else {
      console.info(`[DealFlow360 Action Menu] ${message}`)
    }
  }

  const handleEdit = (e) => {
    e?.stopPropagation?.()
    if (typeof onEdit === 'function') {
      onEdit(record)
    } else {
      handleActionNotice('Edit')
    }
  }

  const handleDelete = (e) => {
    e?.stopPropagation?.()
    if (typeof onDelete === 'function') {
      onDelete(record)
    } else {
      handleActionNotice('Delete')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className}`}
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
      >
        <DropdownMenuItem
          onClick={handleEdit}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground outline-none transition-colors"
        >
          <Pencil className="size-3.5 text-muted-foreground" />
          <span>{editLabel}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus:text-destructive outline-none transition-colors"
        >
          <Trash2 className="size-3.5" />
          <span>{deleteLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TableActionMenu
