'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children, initialPath = '/' }) {
  const auth = useAuth()
  const userRole = auth?.user?.role

  const getInitialRole = () => {
    if (!userRole) return 'Sales Manager'
    const r = userRole.toLowerCase()
    if (r === 'admin') return 'Admin'
    if (r === 'sales_manager') return 'Sales Manager'
    if (r === 'sales_rep' || r === 'sales_executive') return 'Sales Representative'
    if (r === 'finance' || r === 'financial_officer') return 'Financial Officer'
    if (r === 'customer') return 'Customer'
    return 'Sales Manager'
  }

  const [role, setRole] = useState(getInitialRole)

  useEffect(() => {
    if (userRole) {
      setRole(getInitialRole())
    }
  }, [userRole])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('dealflow_theme')
      return stored === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    try {
      localStorage.setItem('dealflow_theme', theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  const [shellPath, setShellPath] = useState(initialPath)

  /**
   * Breadcrumb context: stores the display name of the currently viewed resource
   * (e.g. a warehouse name) so the header breadcrumb can show it.
   */
  const [resourceName, setResourceName] = useState(null)

  // Clear resource name whenever we navigate to a new top-level path
  useEffect(() => {
    // only clear when navigating to a list page, not detail/edit
    const segments = shellPath.split('/').filter(Boolean)
    if (segments.length <= 1) {
      setResourceName(null)
    }
  }, [shellPath])

  const value = useMemo(
    () => ({
      role,
      setRole,
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileNavOpen,
      setMobileNavOpen,
      search,
      setSearch,
      theme,
      setTheme,
      shellPath,
      setShellPath,
      resourceName,
      setResourceName,
    }),
    [role, sidebarCollapsed, mobileNavOpen, search, theme, shellPath, resourceName]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return context
}

/**
 * Maps workspace roles to sidebar section groups they can see.
 * Admin sees everything.
 */
export const roleVisibility = {
  'Admin': ['sales', 'configuration'],
  'Financial Officer': ['sales', 'configuration'],
  'Sales Manager': ['sales', 'operations', 'intelligence', 'configuration'],
  'Sales Representative': ['sales', 'intelligence'],
  'Operations Manager': ['sales', 'operations', 'intelligence'],
}
