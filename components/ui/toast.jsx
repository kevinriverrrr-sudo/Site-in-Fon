"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cn } from '../lib/utils'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, title, description, variant }])
    if (duration) setTimeout(() => remove(id), duration)
    return { id }
  }, [remove])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-end gap-2 p-4 sm:p-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto w-full max-w-sm rounded-md border p-4 shadow-lg transition-opacity bg-background text-foreground',
              t.variant === 'destructive' ? 'border-destructive text-destructive-foreground' : ''
            )}
          >
            {t.title && <div className="font-medium">{t.title}</div>}
            {t.description && <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function Toaster() {
  return null
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
