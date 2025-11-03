"use client"

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useToast } from '../components/ui/toast'

export default function Page() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  return (
    <div className="space-y-8">
      <section>
        <h1 className="heading">Buttons</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="heading">Inputs</h2>
        <div className="mt-4 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Input placeholder="Your name" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Disabled" disabled />
          <Input placeholder="With value" defaultValue="Пример текста" />
        </div>
      </section>

      <section>
        <h2 className="heading">Dialog & Dropdown</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Accessible modal dialog without external deps.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This is a simple dialog implementation with focus trap and ESC/overlay close.
              </p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
                <Button onClick={() => toast({ title: 'Saved', description: 'Changes have been saved.' })}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => toast({ title: 'Создать', description: 'Новый элемент создан.' })}>Create</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast({ title: 'Профиль' })}>Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast({ title: 'Выход' })}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section>
        <h2 className="heading">Tabs</h2>
        <Tabs defaultValue="account" className="mt-4 w-full max-w-2xl">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-4">
            <p className="subtle">Make changes to your account here.</p>
          </TabsContent>
          <TabsContent value="password" className="mt-4">
            <p className="subtle">Change your password here.</p>
          </TabsContent>
        </Tabs>
      </section>

      <section>
        <h2 className="heading">Table</h2>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Иван</TableCell>
                <TableCell>ivan@example.com</TableCell>
                <TableCell>Админ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Мария</TableCell>
                <TableCell>maria@example.com</TableCell>
                <TableCell>Пользователь</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="heading">Form & Toast</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            toast({ title: 'Форма отправлена', description: 'Спасибо!' })
          }}
          className="mt-4 grid max-w-xl gap-4"
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium">Имя</span>
            <Input placeholder="Введите имя" required />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
            <Input placeholder="Введите email" type="email" required />
          </label>
          <div className="flex gap-2">
            <Button type="submit">Отправить</Button>
            <Button type="button" variant="secondary" onClick={() => toast({ title: 'Внимание', description: 'Пример уведомления', variant: 'default' })}>
              Показать тост
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
