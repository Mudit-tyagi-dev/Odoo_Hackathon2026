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

  useEffect(() => {
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(preferred)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const value = useMemo(() => ({ role, setRole, sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, search, setSearch, theme, setTheme, shellPath, setShellPath }), [role, sidebarCollapsed, mobileNavOpen, search, theme, shellPath])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return context
}

export const roleVisibility = {
  'Sales Manager': ['sales', 'operations', 'intelligence', 'configuration'],
  'Sales Representative': ['sales', 'intelligence'],
  'Operations Manager': ['sales', 'operations', 'intelligence'],
}
