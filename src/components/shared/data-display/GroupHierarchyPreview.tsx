import { ChevronDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

export type GroupHierarchyPreviewItem = {
  id?: string | number
  name: string
}

type GroupHierarchyPreviewProps = {
  groups: ReadonlyArray<GroupHierarchyPreviewItem>
  subgroups: ReadonlyArray<GroupHierarchyPreviewItem>
  groupsLabel: string
  subgroupsLabel: string
  emptyLabel?: string
  className?: ComponentProps<'div'>['className']
}

function uniqueNamedItems(items: ReadonlyArray<GroupHierarchyPreviewItem>) {
  const seenNames = new Set<string>()

  return items.flatMap((item) => {
    const name = item.name.trim()
    if (!name || seenNames.has(name)) return []

    seenNames.add(name)
    return [{ ...item, name }]
  })
}

function NamedItemsPopover({
  items,
  label,
  emptyLabel,
}: {
  items: ReadonlyArray<GroupHierarchyPreviewItem>
  label: string
  emptyLabel: string
}) {
  const namedItems = uniqueNamedItems(items)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-28 justify-between gap-3">
          <span>{label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        align="start"
        collisionPadding={16}
        className="w-[min(20rem,calc(100vw-2rem))] p-3"
      >
        <div className="max-h-64 overflow-y-auto overscroll-contain pe-1">
          {namedItems.length ? (
            <div className="flex flex-wrap gap-2">
              {namedItems.map((item, index) => (
                <Badge
                  key={item.id ?? `${item.name}-${index}`}
                  variant="outline"
                  className="max-w-full whitespace-normal break-words text-start"
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-muted">{emptyLabel}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function GroupHierarchyPreview({
  groups,
  subgroups,
  groupsLabel,
  subgroupsLabel,
  emptyLabel = '-',
  className,
}: GroupHierarchyPreviewProps) {
  return (
    <div className={cn('flex min-w-0 flex-wrap gap-2', className)}>
      <NamedItemsPopover items={groups} label={groupsLabel} emptyLabel={emptyLabel} />
      <NamedItemsPopover items={subgroups} label={subgroupsLabel} emptyLabel={emptyLabel} />
    </div>
  )
}
