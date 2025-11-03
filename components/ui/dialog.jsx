"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/utils'

const DialogContext = createContext(null)

export function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(open ?? false)

  useEffect(() => {
    if (open === undefined) return
    setInternalOpen(open)
  }, [open])

  const setOpen = useCallback((v) => {
    const next = typeof v === 'function' ? v(internalOpen) : v
    if (onOpenChange) onOpenChange(next)
    if (open === undefined) setInternalOpen(next)
  }, [internalOpen, onOpenChange, open])

  const value = useMemo(() => ({ open: internalOpen, setOpen }), [internalOpen, setOpen])

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  )
}

export function DialogTrigger({ asChild, children }) {
  const { setOpen } = useContext(DialogContext)
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded="false">{children}</Comp>
  )
}

function useFocusTrap(enabled, containerRef) {
  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function onKeyDown(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        const { setOpen } = container.__ctx || {}
        setOpen?.(false)
      }
    }

    container.addEventListener('keydown', onKeyDown)
    first?.focus()
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [enabled, containerRef])
}

export function DialogContent({ className, children }) {
  const { open, setOpen } = useContext(DialogContext)
  const ref = useRef(null)
  useFocusTrap(open, ref)

  useEffect(() => {
    function onDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onDown)
    return () => document.removeEventListener('keydown', onDown)
  }, [open, setOpen])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div
        ref={(node) => {
          if (node) node.__ctx = { setOpen }
          ref.current = node
        }}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg scale-100 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none',
          'animate-fade-in',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function DialogClose({ asChild, children, ...props }) {
  const { setOpen } = useContext(DialogContext)
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp onClick={() => setOpen(false)} {...props}>
      {children || 'Close'}
    </Comp>
  )
}
