import type { ReactNode } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ResponsiveDataColumn } from './ResponsiveDataLayout'

export function ReportDetailsAccordionItem({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: ReactNode
}) {
  return (
    <AccordionItem value={value} className="overflow-hidden rounded-lg border-0 bg-[#eeeeef] px-4">
      <AccordionTrigger className="text-base font-semibold text-content-primary hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="border-t border-border-subtle pt-4">{children}</AccordionContent>
    </AccordionItem>
  )
}

export function ReportDetailsTable({
  title,
  columns,
  children,
}: {
  title?: string
  columns: ResponsiveDataColumn[]
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg bg-white">
      {title ? (
        <h3 className="border-b border-border-subtle px-4 py-3 text-sm font-semibold text-content-primary">{title}</h3>
      ) : null}
      <div data-testid="detailed-report-responsive-table" data-column-count={columns.length}>
        {children}
      </div>
    </section>
  )
}
