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
          <Ellipsis aria-hidden="true" className="size-5 text-muted-foreground" />
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
        'size-9 shrink-0 hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground',
        className,
        action.variant === 'destructive' &&
          'text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/10 active:text-destructive',
        action.variant === 'success' &&
          'text-success hover:bg-success/10 hover:text-success active:bg-success/10 active:text-success'
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
        'cursor-pointer gap-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground',
        action.variant === 'destructive' &&
          'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive',
        action.variant === 'success' &&
          'text-success hover:bg-success/10 hover:text-success focus:bg-success/10 focus:text-success data-highlighted:bg-success/10 data-highlighted:text-success'
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
