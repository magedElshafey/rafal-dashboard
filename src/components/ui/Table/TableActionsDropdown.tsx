import { Children, isValidElement, cloneElement, MouseEventHandler } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// UI Components
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TableAction } from '@/components/ui/Table/TableAction'

// Icons
import { EllipsisVertical } from 'lucide-react'

// Types
import type { TableActionProps, TableActionsDropdownProps } from '@/components/ui/Table/types'
import { TableCell } from '../table'
import { useRtl } from '@/hooks/useRtl'

export function TableActionsDropdown({
  triggerLabel = 'Actions',
  children,
  className,
  ...restProps
}: TableActionsDropdownProps) {
  const { t } = useTranslation()
  const { isRtl } = useRtl()

  // Helper function to render each valid TableAction child as a DropdownMenuItem inside the actions dropdown.
  const renderChildAction = (child: React.ReactNode, index: number) => {
    if (!isValidElement<TableActionProps>(child) || child.type !== TableAction) {
      return null
    }

    const { onClick, tableActionVariant, permissionName, ...restChildProps } = child.props

    return (
      <DropdownMenuItem
        key={tableActionVariant ?? index}
        onClick={onClick as unknown as MouseEventHandler<HTMLDivElement>}
        className="cursor-pointer !p-0 !h-fit"
        asChild={false}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {cloneElement(child, {
          tableActionVariant,
          permissionName,
          ...restChildProps,
        })}
      </DropdownMenuItem>
    )
  }

  return (
    <TableCell className={cn('text-start', className)} {...restProps}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t('button.table_actions', triggerLabel)}
            title={t('button.table_actions', triggerLabel)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            type="button"
          >
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">{triggerLabel}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">{Children.map(children, renderChildAction)}</DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  )
}
