import { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

type FormActionsLayoutProps = PropsWithChildren<{
  className?: string
}>

export function FormActionsLayout({ children, className }: FormActionsLayoutProps) {
  return <div className={cn('col-span-full flex justify-end gap-4', className)}>{children}</div>
}
