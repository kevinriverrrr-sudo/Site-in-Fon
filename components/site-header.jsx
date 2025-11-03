"use client"

import ThemeToggle from './theme-toggle'
import { Button } from './ui/button'

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-primary" aria-hidden />
          <span className="font-semibold">UI Toolkit</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" asChild>
            <a href="https://nextjs.org" target="_blank" rel="noreferrer">Next.js</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
