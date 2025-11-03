"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

const Ctx = createContext(null)

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const value = { open, setOpen, triggerRef }
  return (
    <Ctx.Provider value={value}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  )
}

export function DropdownMenuTrigger({ asChild, children }) {
  const { setOpen, triggerRef } = useContext(Ctx)
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp ref={triggerRef} onClick={() => setOpen((v) => !v)} aria-haspopup="menu">
      {children}
    </Comp>
  )
}

export function DropdownMenuContent({ className, align = 'start', children }) {
  const { open, setOpen, triggerRef } = useContext(Ctx)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (!ref.current) return
      if (ref.current.contains(e.target)) return
      if (triggerRef.current && triggerRef.current.contains(e.target)) return
      setOpen(false)
    }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false) }
    if (open) {
      document.addEventListener('mousedown', onClickOutside)
      document.addEventListener('keydown', onEsc)
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-fade-in',
        className
      )}
      style={{
        left: align === 'start' ? undefined : '50%',
        right: align === 'end' ? 0 : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, onSelect, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onSelect?.(e)
      }}
      className={cn(
        'flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}
