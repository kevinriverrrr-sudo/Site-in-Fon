"use client"

import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    setIsDark(html.classList.contains('dark'))
  }, [])

  function toggle() {
    const html = document.documentElement
    const next = !html.classList.contains('dark')
    html.classList.toggle('dark', next)
    setIsDark(next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  return (
    <Button variant="outline" onClick={toggle} aria-pressed={isDark} title="Toggle theme">
      {isDark ? 'Dark' : 'Light'}
    </Button>
  )
}
