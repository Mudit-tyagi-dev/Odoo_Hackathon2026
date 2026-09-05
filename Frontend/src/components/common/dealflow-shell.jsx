'use client'

import { useState } from 'react'
// Internal shell navigation uses React state — no nested Router needed
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AdminScreen } from './admin-screen'
import { QuotationBuilder } from './quotation-builder'
import { QuotationsScreen } from './quotations-screen'
import { SalesWorkspace } from './sales-workspace'
import { useWorkspace, WorkspaceProvider, roleVisibility } from './workspace-context'
import { useAuth } from '@/context/AuthContext'

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
      { label: 'Price Lists', path: '/price-lists', icon: FileText },
      { label: 'Discount Rules', path: '/discount-rules', icon: SlidersHorizontal },
      { label: 'Approval Chains', path: '/approval-chains', icon: Users },
      { label: 'Warehouses', path: '/warehouses', icon: Truck },
      { label: 'Subscription Plans', path: '/subscription-plans', icon: Settings2 },
      { label: 'Upsell Rules', path: '/upsell-rules', icon: Plus },
    ],
  },
]

function Header() {
  const { role, setRole, setMobileNavOpen, theme, setTheme } = useWorkspace()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(false)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const displayName = user?.name || (role === 'Sales Manager' ? 'Jordan Lee' : role === 'Sales Representative' ? 'Aarav Mehta' : 'Priya Sharma')
  const displayInitials = user?.initials || displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)

  const handleSignOut = () => {
    if (logout) logout()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-7">
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
        <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          <span>Workspace</span>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{role}</span>
        </div>
      </div>

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
        <div className="relative">
          <Button variant="ghost" className="gap-2 px-2" onClick={() => setProfile(!profile)}>
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {displayInitials}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-xs font-semibold">{displayName}</span>
              <span className="block text-[11px] text-muted-foreground">{role}</span>
            </span>
            <ChevronDown className="hidden size-4 lg:block" />
          </Button>

          {profile && (
            <div className="absolute right-0 top-11 z-20 w-64 rounded-lg border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 border-b mb-1">
                <p className="text-xs font-semibold">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'sales@dealflow360.com'}</p>
              </div>

              <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Switch Role View
              </p>
              {['Sales Manager', 'Sales Representative', 'Operations Manager'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setRole(option)
                    setProfile(false)
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

function Sidebar({ mobile = false }) {
  const { shellPath, setShellPath: navigate, role, sidebarCollapsed, setSidebarCollapsed, setMobileNavOpen } = useWorkspace()
  const location = { pathname: shellPath }

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
          onClick={() => (mobile ? setMobileNavOpen(false) : setSidebarCollapsed(!sidebarCollapsed))}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                const active = location.pathname === item.path
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setMobileNavOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-sidebar-accent cursor-pointer',
                      active && 'bg-sidebar-primary text-sidebar-primary-foreground',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
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

function RoutedContent() {
  const { shellPath, setShellPath: navigate } = useWorkspace()
  const path = shellPath

  if (path === '/quotation-builder') {
    return <QuotationBuilder onBack={() => navigate('/')} />
  }
  if (path === '/quotations') {
    return <QuotationsScreen onNewQuote={() => navigate('/quotation-builder')} />
  }
  if (path === '/') {
    return <SalesWorkspace onNewQuote={() => navigate('/quotation-builder')} />
  }
  return <AdminScreen section={path.slice(1)} onAddProduct={() => {}} />
}

function DealFlowApp() {
  const { mobileNavOpen, setMobileNavOpen } = useWorkspace()

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex min-h-0 flex-1">
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
  const initialPath = initialSection === 'admin' ? '/products' : '/'
  return (
    <WorkspaceProvider initialPath={initialPath}>
      <DealFlowApp />
    </WorkspaceProvider>
  )
}

export default DealFlowShell
