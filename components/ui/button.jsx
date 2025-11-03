"use client"

import { cn } from "../lib/utils"

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

const variants = {
  default: "bg-primary text-primary-foreground shadow hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground shadow hover:opacity-90",
  link: "text-primary underline-offset-4 hover:underline",
}

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

export function Button({ className, variant = "default", size = "default", asChild, ...props }) {
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
}
