import { useId, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'
import { useQuery } from '@/store/queryContext/useQueryContext'

import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'

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
  navigationDisabled?: boolean
  navigationDescription?: string
  showSinglePage?: boolean
}

export default function PaginatedListFooter({
  pagination,
  itemCount,
  getRangeLabel,
  className,
  navigationDisabled = false,
  navigationDescription,
  showSinglePage = false,
}: PaginatedListFooterProps) {
  const { t, i18n } = useTranslation()
  const numbers = new Intl.NumberFormat(i18n.language)
  const descriptionId = useId()
  const { forwardAddQuery } = useQuery()
  const currentPage = pagination?.current_page ?? 1
  const totalPages = pagination?.total_pages ?? 1
  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages])

  if (!pagination || (totalPages <= 1 && !showSinglePage)) return null

  const start = itemCount > 0 ? (currentPage - 1) * pagination.per_page + 1 : 0
  const end = itemCount > 0 ? Math.min((currentPage - 1) * pagination.per_page + itemCount, pagination.total) : 0

  const handlePageChange = (page: number) => {
    if (navigationDisabled || page < 1 || page > totalPages || page === currentPage) return

    forwardAddQuery({ page: String(page) })
  }

  return (
    <footer
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-foreground">{getRangeLabel({ start, end, total: pagination.total })}</p>
        {navigationDescription ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {navigationDescription}
          </p>
        ) : null}
      </div>
      <Pagination
        className="mx-0 w-auto max-w-full justify-end"
        aria-label={t('pagination.label')}
        aria-describedby={navigationDescription ? descriptionId : undefined}
      >
        <PaginationContent className="flex-wrap">
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('pagination.previous')}
              disabled={navigationDisabled || currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="rtl:rotate-180" aria-hidden />
            </Button>
          </PaginationItem>

          {paginationItems.map((item) =>
            typeof item === 'number' ? (
              <PaginationItem key={item}>
                <Button
                  type="button"
                  size="icon"
                  variant={item === currentPage ? 'outline' : 'ghost'}
                  disabled={navigationDisabled}
                  aria-current={item === currentPage ? 'page' : undefined}
                  aria-label={t('pagination.goTo', { page: numbers.format(item) })}
                  onClick={() => handlePageChange(item)}
                >
                  {numbers.format(item)}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('pagination.next')}
              disabled={navigationDisabled || currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="rtl:rotate-180" aria-hidden />
            </Button>
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
