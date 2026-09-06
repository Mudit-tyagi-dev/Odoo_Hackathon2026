'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children, initialPath = '/' }) {
  const [role, setRole] = useState('Sales Manager')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState('light')
  const [shellPath, setShellPath] = useState(initialPath)

  /**
   * Breadcrumb context: stores the display name of the currently viewed resource
   * (e.g. a warehouse name) so the header breadcrumb can show it.
   */
  const [resourceName, setResourceName] = useState(null)

  useEffect(() => {
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(preferred)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

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
