// types
import type { ISortableHeaderBtnProps, TableHeaderProps } from '@/components/ui/Table/types'

// ui components
import { ShadcnTableHeader, TableRow, TableHead } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

// store
import { useQuery } from '@/store/queryContext/useQueryContext'

// icons
import { ArrowDownUp, MoveUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const TableHeader = ({ headers, children, ...restProps }: TableHeaderProps) => {
  return (
    <ShadcnTableHeader {...restProps}>
      {!children ? (
        <TableRow className="[&_th:first-child]:rounded-s-lg! [&_th:last-child]:rounded-e-lg! border-b-0!">
          {headers?.map((item, index) => (
            <TableHead
              key={`${item.title}-${index}`}
              className="sticky top-0 h-12.75 bg-muted p-3 text-start font-normal text-muted-foreground capitalize"
            >
              {item.sortKey ? <SortableHeaderBtn title={item.title} sortKey={item.sortKey} /> : item.title}
            </TableHead>
          ))}
        </TableRow>
      ) : (
        children
      )}
    </ShadcnTableHeader>
  )
}

const SortableHeaderBtn = ({ title, sortKey }: ISortableHeaderBtnProps) => {
  const { forwardAddQuery, forwardQuery, forwardDeleteQuery } = useQuery()
  const query = forwardQuery || {}
  const { sort_by, sort_order } = query

  const isActive = sort_by === sortKey

  // Determine current state based on whether this column is active
  const currentSortState = isActive ? sort_order : 'default'

  // Object mapping current state to corresponding action
  const sortTypes = {
    asc: () => forwardAddQuery({ sort_by: sortKey, sort_order: 'desc' }),
    desc: () => forwardDeleteQuery(['sort_by', 'sort_order']),
    default: () => forwardAddQuery({ sort_by: sortKey, sort_order: 'asc' }),
  } as const

  const nextSortAction = sortTypes[currentSortState as keyof typeof sortTypes]

  return (
    <Button
      variant="ghost"
      className={`group flex items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
      onClick={nextSortAction}
      type="button"
    >
      <ArrowDownUp
        className="w-4 h-4 transition-transform duration-200 group-hover:text-primary"
        aria-label={`Sort by ${title}`}
      />
      {title}
      <span className={cn('ms-1 text-xs font-semibold min-w-2', isActive ? 'visible' : 'invisible')}>
        {sort_order === 'asc' ? (
          <MoveUp className="rotate-180 size-3" />
        ) : sort_order === 'desc' ? (
          <MoveUp className="size-3" />
        ) : null}
      </span>
    </Button>
  )
}

export { TableHeader, SortableHeaderBtn }
