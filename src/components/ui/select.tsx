import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" className="placeholder:capitalize" {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) {
  const {
    i18n: { dir },
  } = useTranslation()
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      dir={dir()}
      className={cn(
        [
          'h-14 w-full',
          'rounded-2xl border border-black-50',
          'bg-black-50',
          'px-4 py-3',
          'text-sm text-content-primary',
          'outline-none transition-all',
          'shadow-none',
          'placeholder:text-content-muted',
          'hover:border-black-100',
          'focus:border-brand-500 focus-visible:border-brand-500',
          'focus:ring-3 focus:ring-brand-500/20 focus-visible:ring-3 focus-visible:ring-brand-500/20',
          'data-[placeholder]:text-content-muted',
          'aria-invalid:border-error-500',
          'aria-invalid:ring-3 aria-invalid:ring-error-500/20',
          'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
          'flex items-center justify-between gap-2',
          '*:data-[slot=select-value]:line-clamp-1',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0',
          '[&_svg:not([class*=size-])]:size-4',
          'disabled:cursor-not-allowed',
        ].join(' '),
        size === 'sm' && 'h-12 rounded-xl',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.Content> & {
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void | Promise<unknown>
  emptyMessage?: React.ReactNode
  loadingMessage?: React.ReactNode
  loadMoreMessage?: React.ReactNode
  scrollThreshold?: number
}

function SelectStatusRow({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) {
  return (
    <div className="flex min-h-9 items-center gap-2 rounded-xl px-3 py-2 text-sm text-content-muted">
      {isLoading && <Loader2Icon className="size-4 animate-spin" />}
      <span>{children}</span>
    </div>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage,
  loadingMessage,
  loadMoreMessage,
  scrollThreshold = 48,
  ...props
}: SelectContentProps) {
  const {
    t,
    i18n: { dir },
  } = useTranslation()
  const loadMoreLockRef = React.useRef(false)
  const childCount = React.Children.count(children)
  const hasOptions = childCount > 0
  const showInitialLoading = isLoading && !hasOptions
  const showEmptyState = !isLoading && !hasOptions

  React.useEffect(() => {
    if (!isFetchingNextPage) {
      loadMoreLockRef.current = false
    }
  }, [isFetchingNextPage])

  const handleViewportScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasNextPage || isLoading || isFetchingNextPage || loadMoreLockRef.current) return

      const target = event.currentTarget
      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight

      if (distanceToBottom <= scrollThreshold) {
        loadMoreLockRef.current = true
        Promise.resolve(onLoadMore()).finally(() => {
          loadMoreLockRef.current = false
        })
      }
    },
    [hasNextPage, isFetchingNextPage, isLoading, onLoadMore, scrollThreshold]
  )

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        dir={dir()}
        className={cn(
          [
            'z-50 max-h-72 min-w-32 overflow-hidden',
            'rounded-2xl border border-border-subtle',
            'bg-surface-card text-content-primary',
            'shadow-dropdown',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          ].join(' '),
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1'
          )}
          onScroll={handleViewportScroll}
        >
          {showInitialLoading ? (
            <SelectStatusRow isLoading>{loadingMessage ?? t('label.loading')}</SelectStatusRow>
          ) : showEmptyState ? (
            <SelectStatusRow>{emptyMessage ?? t('label.no_options')}</SelectStatusRow>
          ) : (
            children
          )}
          {hasOptions && isFetchingNextPage && (
            <SelectStatusRow isLoading>{loadingMessage ?? t('label.loading')}</SelectStatusRow>
          )}
          {hasOptions && hasNextPage && !isFetchingNextPage && !isLoading && (
            <SelectStatusRow>{loadMoreMessage ?? t('label.load_more')}</SelectStatusRow>
          )}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        [
          'relative flex w-full cursor-default select-none items-center gap-2',
          'rounded-[10px] px-3 py-2 text-sm text-content-primary outline-none',
          'transition-colors',
          'focus:bg-brand-50 focus:text-brand-700',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        ].join(' '),
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
