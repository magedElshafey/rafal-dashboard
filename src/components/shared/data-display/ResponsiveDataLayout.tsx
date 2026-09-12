import type { ComponentProps, ReactNode } from 'react'

import { ShadcnTableBody, ShadcnTableHeader, Table, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ResponsiveDataLayoutProps = Omit<ComponentProps<'section'>, 'children'> & {
  header: ReactNode
  isEmpty: boolean
  empty: ReactNode
  isLoading?: boolean
  loading?: ReactNode
  children: ReactNode
}

export function ResponsiveDataLayout({
  header,
  isEmpty,
  empty,
  isLoading = false,
  loading,
  children,
  className,
  ...props
}: ResponsiveDataLayoutProps) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)} {...props}>
      <header className="flex flex-col gap-4 border-b border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
        {header}
      </header>

      {isLoading ? loading : isEmpty ? empty : children}
    </section>
  )
}

export function ResponsiveDataDesktop({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="responsive-data-desktop" className={cn('hidden lg:block', className)} {...props} />
}

export type ResponsiveDataColumn = {
  id: string
  header: ReactNode
  className?: string
}

type ResponsiveDataTableProps = Omit<ComponentProps<typeof Table>, 'children'> & {
  columns: readonly ResponsiveDataColumn[]
  headerRowClassName?: string
  children: ReactNode
}

export function ResponsiveDataTable({ columns, headerRowClassName, children, ...props }: ResponsiveDataTableProps) {
  return (
    <Table {...props}>
      <ShadcnTableHeader>
        <TableRow className={cn('border-border-subtle bg-black-50 hover:bg-black-50', headerRowClassName)}>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                'h-12 px-5 text-start text-[10px] xl:text-xs font-bold  tracking-wide text-neutral-900 text-nowrap text-primary',
                column.className
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </ShadcnTableHeader>
      <ShadcnTableBody>{children}</ShadcnTableBody>
    </Table>
  )
}

export function ResponsiveDataTableRow({ className, ...props }: ComponentProps<typeof TableRow>) {
  return <TableRow className={cn('border-border bg-surface text-nowrap hover:bg-muted/60', className)} {...props} />
}

export function ResponsiveDataTableCell({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell className={cn('px-5 py-4', className)} {...props} />
}

export function ResponsiveDataMobileCards({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="responsive-data-mobile-cards" className={cn('grid gap-3 p-4 lg:hidden', className)} {...props} />
  )
}

type ResponsiveDataMobileCardProps = Omit<ComponentProps<'article'>, 'title'> & {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  facts: ReactNode
  footer?: ReactNode
}

export function ResponsiveDataMobileCard({
  title,
  subtitle,
  actions,
  facts,
  footer,
  className,
  ...props
}: ResponsiveDataMobileCardProps) {
  return (
    <article className={cn('rounded-xl border border-border bg-surface p-4', className)} {...props}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-content-primary">{title}</h3>
          {subtitle && <p className="mt-1 break-all text-xs text-content-secondary">{subtitle}</p>}
        </div>
        {actions}
      </header>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{facts}</dl>

      {footer && <div className="mt-4 border-t border-border-subtle pt-3">{footer}</div>}
    </article>
  )
}

type ResponsiveDataFactProps = ComponentProps<'div'> & {
  label: ReactNode
}

export function ResponsiveDataFact({ label, children, className, ...props }: ResponsiveDataFactProps) {
  return (
    <div className={cn('min-w-0', className)} {...props}>
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-content-primary">{children}</dd>
    </div>
  )
}
