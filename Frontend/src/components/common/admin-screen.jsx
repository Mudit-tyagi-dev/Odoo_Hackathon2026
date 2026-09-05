'use client'

import { useState } from 'react'
import { PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminCollections, products } from './dealflow-data'
import { DataTable, FormField, SectionHeader, Toolbar } from './dealflow-ui'
import { useWorkspace } from './workspace-context'

export function AdminScreen({ section, onAddProduct }) {
  const config = section === 'products' ? null : adminCollections[section]
  const title = config?.title ?? 'Products'
  const description =
    config?.description ?? 'Manage the product catalog used across quotations and price lists.'
  const { search, setSearch } = useWorkspace()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const rows =
    section === 'products'
      ? products
          .filter((product) =>
            Object.values(product).join(' ').toLowerCase().includes(search.toLowerCase())
          )
          .map((product) => [
            product.name,
            product.category,
            product.price,
            product.unit,
            product.status,
            product.stock,
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
            setFormOpen(true)
            if (onAddProduct) onAddProduct()
          }}
        />
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 p-5 md:p-8">
        <Toolbar
          search={search}
          setSearch={setSearch}
          filters={section === 'products' ? ['Active', 'Hardware'] : ['Active']}
          onClear={() => setSearch('')}
        />

        {section === 'products' ? (
          <DataTable
            columns={['Product', 'Category', 'Price', 'Unit', 'Status', 'Stock']}
            rows={rows}
            search=""
          />
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
            {section === 'products' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Category" value="Hardware" onChange={() => {}} />
                <FormField label="Price" value="2480" onChange={() => {}} type="number" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Changes are staged locally until connected to the backend API.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  setError('Name is required.')
                  return
                }
                setFormOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default AdminScreen
