export function Form({ className, ...props }) {
  return <form className={className} {...props} />
}

export function FormItem({ className, ...props }) {
  return <div className={`grid gap-2 ${className || ''}`} {...props} />
}

export function FormLabel({ className, ...props }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props} />
}

export function FormControl({ className, ...props }) {
  return <div className={className} {...props} />
}

export function FormDescription({ className, ...props }) {
  return <p className={`text-sm text-muted-foreground ${className || ''}`} {...props} />
}

export function FormMessage({ className, ...props }) {
  return <p className={`text-sm font-medium text-destructive ${className || ''}`} {...props} />
}
