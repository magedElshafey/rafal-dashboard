import { useMemo } from 'react'

// Context
import { useTableContext } from '@/components/ui/Table/TableContext'

// Utils
import { cn } from '@/lib/utils'

// Store
import { useQuery } from '@/store/queryContext/useQueryContext'

// Types
import { TablePaginationProps } from '@/components/ui/Table/types'

// UI Components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function TablePagination({ onPageChange, ...props }: TablePaginationProps) {
  const { serverData } = useTableContext()
  const { current_page, total_pages } = serverData?.paginate || {}

  const { forwardAddQuery, forwardQuery } = useQuery()
  const query = forwardQuery || { page: current_page }
  const requestedPage = Number(query.page ?? current_page ?? 1)
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), total_pages ?? 1)
  const pageWindow = 1
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === total_pages

  const handlePagination = (selectedPage: string) => {
    forwardAddQuery({ page: selectedPage })
    onPageChange?.(Number(selectedPage))
  }

  const renderPageNumbers = useMemo(() => {
    if (!serverData?.paginate || !total_pages) return []

    const pages = []

    pages.push(
      <PaginationItem key={1}>
        <PaginationLink onClick={() => handlePagination('1')} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    )

    if (currentPage - pageWindow > 1) {
      pages.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    if (currentPage > 1 && currentPage < total_pages) {
      pages.push(
        <PaginationItem key={currentPage}>
          <PaginationLink onClick={() => handlePagination(currentPage.toString())} isActive>
            {currentPage}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (currentPage + pageWindow < total_pages) {
      pages.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    if (total_pages > 1) {
      pages.push(
        <PaginationItem key={total_pages}>
          <PaginationLink
            onClick={() => handlePagination(total_pages.toString())}
            isActive={currentPage === total_pages}
          >
            {total_pages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return pages
  }, [currentPage, total_pages, forwardQuery])

  if (!serverData?.paginate) return null

  return (
    <div {...props} className={cn('flex items-center justify-between px-2 py-4', props.className)}>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePagination(Math.max(1, currentPage - 1).toString())}
              className={cn(isFirstPage && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
          {renderPageNumbers}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePagination(Math.min(total_pages || 0, currentPage + 1).toString())}
              className={cn(isLastPage && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export { TablePagination }
