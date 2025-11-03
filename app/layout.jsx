import './globals.css'
import SiteHeader from '../components/site-header'
import SiteFooter from '../components/site-footer'
import Shell from '../components/shell'
import { Toaster, ToastProvider } from '../components/ui/toast'

export const metadata = {
  title: 'UI Toolkit Demo',
  description: 'Next.js + Tailwind + shadcn-like components with dark mode',
}

function ThemeScript() {
  const script = `
  try {
    const ls = localStorage.getItem('theme');
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const systemDark = mql.matches;
    const isDark = ls === 'dark' || (!ls && systemDark);
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  } catch (e) {}
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <Shell>
              {children}
            </Shell>
            <SiteFooter />
          </div>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
