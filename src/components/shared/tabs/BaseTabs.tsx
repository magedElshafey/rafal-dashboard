import { memo, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import type { BaseTabItem, BaseTabsVariant } from './types'

type AriaInvalid = boolean | 'false' | 'true' | 'grammar' | 'spelling'

export type BaseTabsProps<TValue extends string = string> = {
  tabs: BaseTabItem<TValue>[]
  activeValue: TValue
  onValueChange: (value: TValue) => void
  variant?: BaseTabsVariant
  fullWidth?: boolean
  label?: ReactNode
  ariaLabel?: string
  className?: string
  listClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  inactiveTabClassName?: string
  labelClassName?: string
  id?: string
  panelId?: string
  'aria-describedby'?: string
  'aria-invalid'?: AriaInvalid
}

export function getBaseTabId(tabListId: string, value: string) {
  return `${tabListId}-tab-${encodeURIComponent(value)}`
}

function getFullWidthGridClass(tabsCount: number) {
  if (tabsCount === 2) return 'md:grid-cols-2'
  if (tabsCount === 3) return 'md:grid-cols-3'
  if (tabsCount === 4) return 'md:grid-cols-4'

  return ''
}

function BaseTabsComponent<TValue extends string>({
  tabs,
  activeValue,
  onValueChange,
  variant = 'segmented',
  fullWidth = false,
  label,
  ariaLabel,
  className,
  listClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  labelClassName,
  id,
  panelId,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: BaseTabsProps<TValue>) {
  const generatedId = useId()
  const tabListId = id ?? `tabs-${generatedId}`
  const labelId = `${tabListId}-label`
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const isSegmented = variant === 'segmented'
  const isUnderline = variant === 'underline'
  const isPills = variant === 'pills'
  const hasVisibleLabel = Boolean(label)
  const activeTabIndex = tabs.findIndex((tab) => tab.value === activeValue && !tab.disabled)
  const tabbableTabIndex = activeTabIndex >= 0 ? activeTabIndex : tabs.findIndex((tab) => !tab.disabled)

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledIndexes = tabs.reduce<number[]>((indexes, tab, index) => {
      if (!tab.disabled) indexes.push(index)
      return indexes
    }, [])
    const currentEnabledIndex = enabledIndexes.indexOf(currentIndex)

    if (currentEnabledIndex < 0) return

    const explicitDirection = event.currentTarget.closest<HTMLElement>('[dir]')?.getAttribute('dir')
    const computedDirection = event.currentTarget.ownerDocument.defaultView?.getComputedStyle(
      event.currentTarget
    ).direction
    const isRtl =
      (explicitDirection ?? computedDirection ?? event.currentTarget.ownerDocument.documentElement.dir) === 'rtl'

    let targetIndex: number | undefined

    if (event.key === 'Home') {
      targetIndex = enabledIndexes[0]
    } else if (event.key === 'End') {
      targetIndex = enabledIndexes[enabledIndexes.length - 1]
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const movesForward = event.key === (isRtl ? 'ArrowLeft' : 'ArrowRight')
      const offset = movesForward ? 1 : -1
      const targetEnabledIndex = (currentEnabledIndex + offset + enabledIndexes.length) % enabledIndexes.length

      targetIndex = enabledIndexes[targetEnabledIndex]
    }

    if (targetIndex === undefined) return

    event.preventDefault()
    tabRefs.current[targetIndex]?.focus()
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      {hasVisibleLabel && (
        <div id={labelId} className={cn('mb-3 text-sm font-medium text-content-primary', labelClassName)}>
          {label}
        </div>
      )}

      <div
        className={cn(
          'w-full min-w-0 overflow-x-auto overscroll-x-contain',
          'scrollbar-none [&::-webkit-scrollbar]:hidden'
        )}
      >
        <div
          id={tabListId}
          role="tablist"
          aria-orientation="horizontal"
          aria-label={hasVisibleLabel ? undefined : ariaLabel}
          aria-labelledby={hasVisibleLabel ? labelId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            isUnderline && 'border-b border-border-subtle',
            isUnderline && 'inline-flex min-w-max',

            fullWidth && isUnderline && 'md:grid md:min-w-0 md:w-full',
            fullWidth && isUnderline && getFullWidthGridClass(tabs.length),

            isPills && 'inline-flex min-w-max items-center justify-center gap-3',

            isSegmented &&
              (fullWidth
                ? 'flex w-max min-w-full items-stretch gap-1 rounded-xl bg-surface-light p-1'
                : 'inline-flex min-w-max items-stretch gap-1 rounded-xl bg-surface-light p-1'),

            listClassName
          )}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.value === activeValue

            return (
              <button
                key={tab.value}
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                id={getBaseTabId(tabListId, tab.value)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={tab.disabled || undefined}
                tabIndex={index === tabbableTabIndex ? 0 : -1}
                disabled={tab.disabled}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                onClick={() => {
                  onValueChange(tab.value)
                }}
                className={cn(
                  'cursor-pointer inline-flex shrink-0 items-center justify-center gap-1.5 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',

                  !isSegmented && 'whitespace-nowrap',

                  isSegmented && 'min-h-10 rounded-lg px-2 text-center text-sm font-medium',
                  fullWidth && isSegmented && 'min-w-max flex-1',

                  isUnderline && 'h-12 border-b px-4 text-sm font-medium sm:h-14 sm:px-5 sm:text-base md:h-16',
                  fullWidth && isUnderline && 'md:shrink md:px-3',

                  isPills && 'h-8 rounded-full px-4 text-xs font-medium',

                  isUnderline &&
                    (isActive
                      ? 'border-brand-500 text-brand-500'
                      : 'border-transparent text-content-secondary hover:text-brand-500'),

                  isPills &&
                    (isActive
                      ? 'bg-brand-500! text-white! hover:bg-brand-600'
                      : 'bg-resource-badge-bg text-content-secondary hover:bg-surface-muted hover:text-content-primary'),

                  isSegmented &&
                    (isActive
                      ? 'bg-surface-card text-brand-500'
                      : 'bg-transparent text-content-primary hover:bg-surface-card/70'),

                  isActive ? activeTabClassName : inactiveTabClassName,
                  tabClassName
                )}
              >
                {tab.icon && (
                  <span className="inline-flex shrink-0 items-center" aria-hidden="true">
                    {tab.icon}
                  </span>
                )}

                <span className={cn('min-w-0', isSegmented ? 'whitespace-nowrap text-center leading-4' : 'truncate')}>
                  {tab.label}
                </span>

                {typeof tab.count === 'number' && (
                  <span className="shrink-0 text-xs opacity-80 sm:text-sm">({tab.count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const BaseTabs = memo(BaseTabsComponent) as typeof BaseTabsComponent
