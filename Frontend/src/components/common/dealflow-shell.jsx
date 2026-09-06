// DealFlow360 — Sales / Admin Shell
// Internal shell router using shellPath state (no nested react-router needed).

'use client'

import { useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PackageCheck,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sun,
  Truck,
  Users,
  LogOut,
  ExternalLink,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'
import { AdminScreen } from './admin-screen'
import { QuotationBuilder } from './quotation-builder'
import { QuotationsScreen } from './quotations-screen'
import { SalesWorkspace } from './sales-workspace'
import { WarehouseList, WarehouseDetail, WarehouseForm, AddInventoryScreen } from './warehouse-screen'
import { useWorkspace, WorkspaceProvider, roleVisibility } from './workspace-context'
import { useAuth, ROLES } from '@/context/AuthContext'
import QuotationDetailModal from '../modals/QuotationDetailModal'

// ─────────────────────────────────────────────
// Nav definition
// ─────────────────────────────────────────────

const nav = [
  {
    group: 'SALES',
    items: [
      { label: 'Sales Workspace', path: '/', icon: LayoutDashboard },
      { label: 'Quotations', path: '/quotations', icon: FileText },
    ],
  },
  {
    group: 'CONFIGURATION',
    items: [
      { label: 'Products', path: '/products', icon: PackageCheck },
      // { label: 'Price Lists', path: '/price-lists', icon: FileText },
      { label: 'Discount Rules', path: '/discount-rules', icon: SlidersHorizontal },
      { label: 'Tax & GST Rules', path: '/tax-rules', icon: Percent },
      // { label: 'Approval Chains', path: '/approval-chains', icon: Users },
      { label: 'Warehouses', path: '/warehouses', icon: Truck },
      { label: 'Subscription Plans', path: '/subscription-plans', icon: Settings2 },
      // { label: 'Upsell Rules', path: '/upsell-rules', icon: Plus },
    ],
  },
]

// ─────────────────────────────────────────────
// Breadcrumb helpers
// ─────────────────────────────────────────────

/**
 * Returns the label of the first nav item that matches the given path prefix.
 */
function getNavLabel(path) {
  for (const section of nav) {
    for (const item of section.items) {
      if (item.path === path) return item.label
    }
  }
  return null
}

/**
 * Builds an array of breadcrumb segments for the given shellPath.
 * Each segment: { label, path, isLast }
 */
function buildBreadcrumbs(shellPath, resourceName) {
  const segments = [{ label: 'Admin', path: '/admin', isLast: false }]

  const path = shellPath || '/'

  // Top-level paths
  const topLevelPathMap = {
    '/': 'Sales Workspace',
    '/quotations': 'Quotations',
    '/quotation-builder': 'New Quotation',
    '/products': 'Products',
    '/price-lists': 'Price Lists',
    '/discount-rules': 'Discount Rules',
    '/approval-chains': 'Approval Chains',
    '/warehouses': 'Warehouses',
    '/subscription-plans': 'Subscription Plans',
    '/upsell-rules': 'Upsell Rules',
  }

  if (path === '/') {
    return [{ label: 'Sales Workspace', path: '/', isLast: true }]
  }

  const cleanPath = path.replace(/^\/admin/, '') || '/'

  // Warehouse sub-routes
  if (cleanPath.startsWith('/warehouses')) {
    segments.push({ label: 'Warehouses', path: '/admin/warehouses', isLast: false })

    if (cleanPath === '/warehouses') {
      segments[segments.length - 1].isLast = true
      return segments
    }

    if (cleanPath === '/warehouses/new') {
      segments.push({ label: 'Create Warehouse', path: null, isLast: true })
      return segments
    }

    // /warehouses/:id or /warehouses/:id/edit or /warehouses/:id/inventory/add
    const cleanNoQuery = cleanPath.split('?')[0]
    const parts = cleanNoQuery.split('/').filter(Boolean)
    const id = parts[1]

    if (id) {
      const nameLabel = resourceName || `Warehouse #${id}`
      if (parts.length === 2) {
        // detail page: Workspace > Admin > Warehouses > Warehouse Name
        segments.push({ label: nameLabel, path: `/admin/warehouses/${id}`, isLast: true })
      } else if (parts[2] === 'edit') {
        // edit page: Workspace > Admin > Warehouses > Warehouse Name > Edit
        segments.push({ label: nameLabel, path: `/admin/warehouses/${id}`, isLast: false })
        segments.push({ label: 'Edit', path: null, isLast: true })
      } else if (parts[2] === 'inventory' && parts[3] === 'add') {
        // add inventory page: Workspace > Admin > Warehouses > Warehouse Name > Add Inventory
        segments.push({ label: nameLabel, path: `/admin/warehouses/${id}`, isLast: false })
        segments.push({ label: 'Add Inventory', path: null, isLast: true })
      }
    }
    return segments
  }

  // Other admin pages
  const label = topLevelPathMap[cleanPath]
  if (label) {
    segments.push({ label, path: `/admin${cleanPath}`, isLast: true })
  }

  return segments
}

// ─────────────────────────────────────────────
// Role resolution
// ─────────────────────────────────────────────

const ROLE_DISPLAY_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.SALES_EXECUTIVE]: 'Sales Executive',
  [ROLES.CUSTOMER]: 'Customer',
}

const SWITCH_ROLE_OPTIONS = [
  'Admin',
  'Financial Officer',
  'Sales Manager',
  'Sales Representative',
]

// ─────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────

function Header() {
  const { role, setRole, setMobileNavOpen, theme, setTheme, shellPath, setShellPath, resourceName } = useWorkspace()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const displayName = user?.name || (
    role === 'Admin' ? 'Priya Sharma'
    : role === 'Sales Manager' ? 'Jordan Lee'
    : role === 'Sales Representative' ? 'Aarav Mehta'
    : role === 'Financial Officer' ? 'Ravi Desai'
    : 'Team Member'
  )
  const displayInitials =
    user?.initials ||
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  // Show "Administrator" label when auth role is admin
  const authRoleLabel =
    user?.role === ROLES.ADMIN
      ? ROLE_DISPLAY_LABELS[ROLES.ADMIN]
      : role

  const handleSignOut = () => {
    if (logout) logout()
    window.location.href = '/login'
  }

  const routerNavigate = useNavigate()

  // Build breadcrumbs
  const breadcrumbs = buildBreadcrumbs(shellPath, resourceName)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-7">
      {/* Left: logo + breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">D</span>
          </div>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            DealFlow<span className="text-primary">360</span>
          </span>
        </div>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        {/* Clickable breadcrumbs using existing router */}
        <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex" aria-label="Breadcrumb">
          {/* Workspace root */}
          <button
            type="button"
            onClick={() => {
              routerNavigate('/')
              setShellPath('/')
            }}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Workspace
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0" />
              {crumb.path && !crumb.isLast ? (
                <button
                  type="button"
                  onClick={() => {
                    routerNavigate(crumb.path)
                    setShellPath(crumb.path.replace(/^\/admin/, '') || '/products')
                  }}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={cn(crumb.isLast && 'font-medium text-foreground')}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: actions + profile */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Help">
          <CircleHelp />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        {/* Profile dropdown */}
        <div className="relative">
          <Button
            id="profile-menu-btn"
            variant="ghost"
            className="gap-2 px-2"
            onClick={() => setProfileOpen((o) => !o)}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {displayInitials}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-xs font-semibold">{displayName}</span>
              <span className="block text-[11px] text-muted-foreground">{authRoleLabel}</span>
            </span>
            <ChevronDown className="hidden size-4 lg:block" />
          </Button>

          {profileOpen && (
            <div className="absolute right-0 top-11 z-20 w-64 rounded-lg border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              {/* User info */}
              <div className="px-2 py-1.5 border-b mb-1">
                <p className="text-xs font-semibold">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || 'sales@dealflow360.com'}
                </p>
                {user?.role === ROLES.ADMIN && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Administrator
                  </span>
                )}
              </div>

              {/* Role switcher */}
              <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Switch Role View
              </p>
              {SWITCH_ROLE_OPTIONS.map((option) => (
                <button
                  key={option}
                  id={`role-switch-${option.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setRole(option)
                    setProfileOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent cursor-pointer',
                    role === option && 'font-semibold text-primary'
                  )}
                >
                  <span>{option}</span>
                  {role === option && <span className="size-1.5 rounded-full bg-primary" />}
                </button>
              ))}

              <div className="my-1 border-t" />

              <a
                href="/portal"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                <span>Customer Portal</span>
              </a>

              <button
                id="sign-out-btn"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="size-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

function Sidebar({ mobile = false }) {
  const {
    shellPath,
    setShellPath: navigate,
    role,
    sidebarCollapsed,
    setSidebarCollapsed,
    setMobileNavOpen,
  } = useWorkspace()

  // Active matching: /warehouses/123/edit → 'warehouses' segment matches /warehouses nav item
  const isActive = (itemPath) => {
    if (itemPath === '/') return shellPath === '/'
    return shellPath === itemPath || shellPath.startsWith(itemPath + '/')
  }

  // Filter sections by role visibility
  const allowedSections = roleVisibility[role] || ['sales', 'configuration']
  const filteredNav = nav.filter((section) => {
    if (section.group === 'CONFIGURATION') {
      return allowedSections.includes('configuration')
    }
    return true
  })

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground',
        !mobile && (sidebarCollapsed ? 'w-[72px]' : 'w-[248px]')
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground',
            sidebarCollapsed && 'sr-only'
          )}
        >
          Navigation
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-sidebar-accent"
          onClick={() =>
            mobile ? setMobileNavOpen(false) : setSidebarCollapsed(!sidebarCollapsed)
          }
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {filteredNav.map((section) => (
          <div key={section.group} className="mb-6">
            <p
              className={cn(
                'mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground',
                sidebarCollapsed && 'sr-only'
              )}
            >
              {section.group}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      navigate(item.path)
                      setMobileNavOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-sidebar-accent cursor-pointer transition-colors',
                      active && 'bg-sidebar-primary text-sidebar-primary-foreground',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className={cn(sidebarCollapsed && 'sr-only')}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Routed Content — internal shell router
// ─────────────────────────────────────────────

function RoutedContent() {
  const { shellPath, setShellPath, setResourceName } = useWorkspace()
  const location = useLocation()
  const routerNavigate = useNavigate()

  const navigate = (target) => {
    const clean = target.replace(/^\/admin/, '') || '/products'
    const full = target.startsWith('/admin') ? target : (clean === '/' ? '/' : `/admin${clean}`)
    routerNavigate(full)
    setShellPath(clean)
  }

  const cleanPath = (shellPath || '/').replace(/^\/admin/, '') || '/'

  // ── Warehouse routes ──────────────────────────────────────
  if (cleanPath === '/warehouses') {
    return <WarehouseList onNavigate={navigate} />
  }

  if (cleanPath === '/warehouses/new') {
    return (
      <WarehouseForm
        warehouseId={null}
        onNavigate={navigate}
        onBack={() => navigate('/warehouses')}
      />
    )
  }

  // /warehouses/:id/inventory/add
  const invAddMatch = cleanPath.match(/^\/warehouses\/(\d+)\/inventory\/add/)
  if (invAddMatch) {
    const id = invAddMatch[1]
    return (
      <AddInventoryScreenWithName
        warehouseId={id}
        onNavigate={navigate}
        onBack={() => navigate(`/warehouses/${id}`)}
        setResourceName={setResourceName}
      />
    )
  }

  // /warehouses/:id/edit
  const editMatch = cleanPath.match(/^\/warehouses\/(\d+)\/edit/)
  if (editMatch) {
    const id = editMatch[1]
    return (
      <WarehouseFormWithName
        warehouseId={id}
        onNavigate={navigate}
        onBack={() => navigate(`/warehouses/${id}`)}
        setResourceName={setResourceName}
      />
    )
  }

  // /warehouses/:id
  const detailMatch = cleanPath.match(/^\/warehouses\/(\d+)/)
  if (detailMatch) {
    const id = detailMatch[1]
    return (
      <WarehouseDetailWithName
        warehouseId={id}
        onNavigate={navigate}
        onBack={() => navigate('/warehouses')}
        setResourceName={setResourceName}
      />
    )
  }

  // ── Sales routes ──────────────────────────────────────────
  if (cleanPath === '/quotation-builder') {
    return <QuotationBuilder onBack={() => navigate('/')} />
  }
  if (cleanPath === '/quotations') {
    return <QuotationsScreenWithModal navigate={navigate} />
  }
  if (cleanPath === '/') {
    return <SalesWorkspaceWithModal navigate={navigate} />
  }

  // ── Admin / config routes ─────────────────────────────────
  return <AdminScreen section={cleanPath.slice(1)} onAddProduct={() => {}} />
}

/**
 * Wraps SalesWorkspace with local state for viewing quotation details.
 */
function SalesWorkspaceWithModal({ navigate }) {
  const [selectedQuotation, setSelectedQuotation] = useState(null)

  return (
    <>
      <SalesWorkspace
        onNewQuote={() => navigate('/quotation-builder')}
        onViewQuotation={(q) => setSelectedQuotation(q)}
      />
      <QuotationDetailModal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onUpdateQuotation={(updated) => setSelectedQuotation(updated)}
      />
    </>
  )
}

/**
 * Wraps QuotationsScreen with local state for viewing quotation details.
 */
function QuotationsScreenWithModal({ navigate }) {
  const [selectedQuotation, setSelectedQuotation] = useState(null)

  return (
    <>
      <QuotationsScreen
        onNewQuote={() => navigate('/quotation-builder')}
        onViewQuotation={(q) => setSelectedQuotation(q)}
      />
      <QuotationDetailModal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onUpdateQuotation={(updated) => setSelectedQuotation(updated)}
      />
    </>
  )
}

/**
 * Wrapper for Add Inventory with warehouse name breadcrumb support
 */
function AddInventoryScreenWithName({ warehouseId, onNavigate, onBack, setResourceName }) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const initialProductId = searchParams.get('product_id')

  return (
    <AddInventoryScreen
      warehouseId={warehouseId}
      initialProductId={initialProductId}
      onNavigate={onNavigate}
      onBack={onBack}
      onWarehouseLoaded={(name) => setResourceName(name)}
      onInventoryAdded={() => {
        // Will refresh when returning to WarehouseDetail
      }}
    />
  )
}

/**
 * Wrapper that sets resourceName (for breadcrumb) from the loaded warehouse.
 */
function WarehouseDetailWithName({ warehouseId, onNavigate, onBack, setResourceName }) {
  return (
    <WarehouseDetail
      warehouseId={warehouseId}
      onNavigate={onNavigate}
      onBack={onBack}
      onWarehouseLoaded={(name) => setResourceName(name)}
    />
  )
}

function WarehouseFormWithName({ warehouseId, onNavigate, onBack, setResourceName }) {
  return (
    <WarehouseForm
      warehouseId={warehouseId}
      onNavigate={onNavigate}
      onBack={onBack}
      onWarehouseLoaded={(name) => setResourceName(name)}
    />
  )
}

// ─────────────────────────────────────────────
// App shell
// ─────────────────────────────────────────────

function DealFlowApp() {
  const { mobileNavOpen, setMobileNavOpen } = useWorkspace()

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background relative">
        <div className="aurora-bg-mesh">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>
        <Header />
        <div className="flex min-h-0 flex-1 z-10">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetTitle className="sr-only">DealFlow360 navigation</SheetTitle>
              <Sidebar mobile />
            </SheetContent>
          </Sheet>
          <RoutedContent />
        </div>
      </div>
    </TooltipProvider>
  )
}

export function DealFlowShell({ initialSection = 'sales' }) {
  const location = useLocation()
  let initialPath = initialSection === 'admin' ? '/products' : '/'

  if (location.pathname.startsWith('/admin')) {
    const sub = location.pathname.replace(/^\/admin/, '')
    const search = location.search || ''
    if (sub) {
      initialPath = sub + search
    }
  }

  return (
    <WorkspaceProvider initialPath={initialPath}>
      <DealFlowApp />
    </WorkspaceProvider>
  )
}

export default DealFlowShell
