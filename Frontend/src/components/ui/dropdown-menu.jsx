import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"

// Dropdown menu built with React state — no @base-ui/react dependency needed
const DropdownMenuContext = React.createContext({})

function DropdownMenu({ children, ...props }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} data-slot="dropdown-menu" className="relative inline-block" {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuPortal({ children }) {
  const { open } = React.useContext(DropdownMenuContext)
  if (!open) return null
  return <>{children}</>
}

function DropdownMenuTrigger({ children, asChild, ...props }) {
  const { setOpen, open } = React.useContext(DropdownMenuContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      "data-slot": "dropdown-menu-trigger",
      onClick: (e) => {
        children.props.onClick?.(e)
        setOpen((prev) => !prev)
      },
    })
  }
  return (
    <button
      data-slot="dropdown-menu-trigger"
      onClick={() => setOpen((prev) => !prev)}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  align = "start",
  className,
  children,
  ...props
}) {
  const { open } = React.useContext(DropdownMenuContext)
  if (!open) return null

  const alignClass = align === "end" ? "right-0" : "left-0"

  return (
    <div
      data-slot="dropdown-menu-content"
      className={cn(
        "absolute z-50 mt-1 min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95",
        alignClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuGroup({ ...props }) {
  return <div data-slot="dropdown-menu-group" role="group" {...props} />
}

function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground",
        inset && "pl-7",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({ className, inset, variant = "default", onClick, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      data-slot="dropdown-menu-item"
      role="menuitem"
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-7",
        variant === "destructive" && "text-destructive hover:bg-destructive/10",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(e)
          setOpen(false)
        }
      }}
      {...props}
    />
  )
}

function DropdownMenuSub({ children }) {
  const [subOpen, setSubOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open: subOpen, setOpen: setSubOpen }}>
      <div data-slot="dropdown-menu-sub" className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
        inset && "pl-7",
        className
      )}
      onClick={() => setOpen((prev) => !prev)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </div>
  )
}

function DropdownMenuSubContent({ className, ...props }) {
  const { open } = React.useContext(DropdownMenuContext)
  if (!open) return null
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "absolute left-full top-0 z-50 min-w-24 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({ className, children, checked, inset, onChange, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      data-slot="dropdown-menu-checkbox-item"
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
        inset && "pl-7",
        className
      )}
      onClick={() => {
        onChange?.(!checked)
        setOpen(false)
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function DropdownMenuRadioGroup({ value, onValueChange, children, ...props }) {
  return (
    <div data-slot="dropdown-menu-radio-group" role="radiogroup" {...props}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { _groupValue: value, _onValueChange: onValueChange })
          : child
      )}
    </div>
  )
}

function DropdownMenuRadioItem({ className, children, inset, value, _groupValue, _onValueChange, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  const checked = _groupValue === value
  return (
    <div
      data-slot="dropdown-menu-radio-item"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
        inset && "pl-7",
        className
      )}
      onClick={() => {
        _onValueChange?.(value)
        setOpen(false)
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function DropdownMenuSeparator({ className, ...props }) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
