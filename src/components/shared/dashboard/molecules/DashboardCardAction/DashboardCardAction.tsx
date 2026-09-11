import * as React from 'react'
import { Ellipsis, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { CardActionItem, DashboardCardActionsProps } from './dashboard-card-actions.types'

export type {
  CardActionItem,
  CardActionVariant,
  DashboardCardActionsProps,
  DashboardCardActionTriggerMode,
} from './dashboard-card-actions.types'

export function DashboardCardActions({
  actions,
  className = 'text-neutral-600',
  disabled = false,
  align = 'end',
  side = 'bottom',
  sideOffset = 4,
  triggerLabel = 'Open actions menu',
  triggerMode = 'auto',
}: DashboardCardActionsProps) {
  const visibleActions = React.useMemo(() => actions.filter((action) => !action.hidden), [actions])
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (disabled) {
      setIsMenuOpen(false)
    }
  }, [disabled])

  if (visibleActions.length === 0) {
    return null
  }

  if (visibleActions.length === 1 && triggerMode === 'auto') {
    return <SingleCardAction action={visibleActions[0]} className={className} disabled={disabled} />
  }

  return (
    <DropdownMenu
      open={isMenuOpen}
      onOpenChange={(open) => {
        if (!disabled) {
          setIsMenuOpen(open)
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn('size-9 shrink-0', className)}
          aria-label={triggerLabel}
        >
          <Ellipsis aria-hidden="true" className="size-5 text-black-text" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} side={side} sideOffset={sideOffset} className="min-w-40">
        {visibleActions.map((action) => (
          <CardActionMenuItem key={action.id} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type SingleCardActionProps = {
  action: CardActionItem
  className?: string
  disabled?: boolean
}

function SingleCardAction({ action, className, disabled = false }: SingleCardActionProps) {
  const Icon = action.icon
  const isDisabled = disabled || action.disabled || action.isLoading

  const handleClick = React.useCallback(() => {
    if (isDisabled) return

    void action.onClick()
  }, [action, isDisabled])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isDisabled}
      aria-busy={action.isLoading || undefined}
      aria-label={action.accessibleLabel ?? action.label}
      title={action.label}
      className={cn(
        'size-9 shrink-0 hover:bg-black-50 hover:text-black-700 active:bg-black-50 active:text-black-700',
        action.variant === 'destructive' &&
          'text-error-700 hover:bg-error-50 hover:text-error-700 active:bg-error-50 active:text-error-700',
        action.variant === 'success' &&
          'text-success-700 hover:bg-success-50 hover:text-success-700 active:bg-success-50 active:text-success-700',
        className
      )}
      onClick={handleClick}
    >
      {action.isLoading ? (
        <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      ) : (
        <Icon aria-hidden="true" className="size-4" />
      )}
    </Button>
  )
}

type CardActionMenuItemProps = {
  action: CardActionItem
}

function CardActionMenuItem({ action }: CardActionMenuItemProps) {
  const Icon = action.icon
  const isDisabled = action.disabled || action.isLoading

  const handleSelect = React.useCallback(
    (event: Event) => {
      if (isDisabled) {
        event.preventDefault()
        return
      }

      void action.onClick()
    },
    [action, isDisabled]
  )

  return (
    <DropdownMenuItem
      disabled={isDisabled}
      aria-busy={action.isLoading || undefined}
      aria-label={action.accessibleLabel}
      onSelect={handleSelect}
      className={cn(
        'cursor-pointer gap-2 hover:bg-black-50 hover:text-black-700 focus:bg-black-50 focus:text-black-700',
        'data-highlighted:bg-black-50 data-highlighted:text-black-700'
      )}
    >
      {action.isLoading ? (
        <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      ) : (
        <Icon aria-hidden="true" className="size-4" />
      )}

      <span>{action.label}</span>
    </DropdownMenuItem>
  )
}
