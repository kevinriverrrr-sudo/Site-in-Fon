"use client"

import { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '../lib/utils'

const TabsCtx = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(value ?? defaultValue)

  const setVal = (v) => {
    onValueChange?.(v)
    if (value === undefined) setInternal(v)
  }

  const ctx = useMemo(() => ({ value: value ?? internal, setValue: setVal }), [value, internal])

  return (
    <TabsCtx.Provider value={ctx}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ className, ...props }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)} {...props} />
  )
}

export function TabsTrigger({ value, className, children }) {
  const { value: v, setValue } = useContext(TabsCtx)
  const isActive = v === value
  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }) {
  const { value: v } = useContext(TabsCtx)
  if (v !== value) return null
  return <div className={cn('ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>{children}</div>
}
