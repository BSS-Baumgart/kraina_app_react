'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function ResponsiveDialog({ children, open, onOpenChange }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function ResponsiveDialogTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerTrigger {...props}>{children}</DrawerTrigger>
  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        <div className="overflow-y-auto max-h-[85svh]">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({ children, className, ...props }: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerHeader className={className} {...props}>{children}</DrawerHeader>
  return <DialogHeader className={className} {...props}>{children}</DialogHeader>
}

function ResponsiveDialogTitle({ children, className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerTitle className={className} {...props}>{children}</DrawerTitle>
  return <DialogTitle className={className} {...props}>{children}</DialogTitle>
}

function ResponsiveDialogDescription({ children, className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerDescription className={className} {...props}>{children}</DrawerDescription>
  return <DialogDescription className={className} {...props}>{children}</DialogDescription>
}

function ResponsiveDialogFooter({ children, className, ...props }: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerFooter className={className} {...props}>{children}</DrawerFooter>
  return <DialogFooter className={className} {...props}>{children}</DialogFooter>
}

function ResponsiveDialogClose({ children, ...props }: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useIsMobile()
  if (isMobile) return <DrawerClose {...props}>{children}</DrawerClose>
  return <DialogClose {...props}>{children}</DialogClose>
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
}
