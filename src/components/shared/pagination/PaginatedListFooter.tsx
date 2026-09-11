import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import { useQuery } from '@/store/queryContext/useQueryContext'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type PaginationRange = {
  start: number
  end: number
  total: number
}

type PaginatedListFooterProps = {
  pagination?: Pagination
  itemCount: number
  getRangeLabel: (range: PaginationRange) => string
  className?: string
}

export default function PaginatedListFooter({
  pagination,
  itemCount,
  getRangeLabel,
  className,
}: PaginatedListFooterProps) {
  const { forwardAddQuery } = useQuery()
  const currentPage = pagination?.current_page ?? 1
  const totalPages = pagination?.total_pages ?? 1
  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages])

  if (!pagination || totalPages <= 1) return null

  const start = pagination.total > 0 ? (currentPage - 1) * pagination.per_page + 1 : 0
  const end = Math.min((currentPage - 1) * pagination.per_page + itemCount, pagination.total)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    forwardAddQuery({ page: String(page) })
  }

  return (
    <footer
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-sm text-black-text">{getRangeLabel({ start, end, total: pagination.total })}</p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>

          {paginationItems.map((item) =>
            typeof item === 'number' ? (
              <PaginationItem key={item}>
                <PaginationLink onClick={() => handlePageChange(item)} isActive={item === currentPage}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={cn(currentPage === totalPages && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </footer>
  )
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [1]

  if (currentPage > 3) {
    pages.push('ellipsis-start')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis-end')
  }

  pages.push(totalPages)

  return pages
}
