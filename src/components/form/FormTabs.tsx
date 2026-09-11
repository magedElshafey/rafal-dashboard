import { memo, type ReactNode, useCallback, useMemo } from 'react'
import { type FieldValues, type Path, type PathValue, useFormContext, useWatch } from 'react-hook-form'

import { AppTabs, type AppTabItem } from '@/components/shared/tabs/AppTabs'
import type { BaseTabsVariant } from '@/components/shared/tabs/types'
import { FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'

type FormTabsProps<TFieldValues extends FieldValues = FieldValues> = {
  name: Path<TFieldValues>
  tabs: AppTabItem<string>[]
  label?: ReactNode
  ariaLabel?: string
  variant?: BaseTabsVariant
  fullWidth?: boolean
  disabled?: boolean
  isLoading?: boolean
  loadingMessage?: ReactNode
  emptyMessage?: ReactNode

  skeletonCount?: number
  skeletonClassName?: string

  onChange?: (value: string) => void
  itemClassName?: string
  labelClassName?: string
  listClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  inactiveTabClassName?: string
  messageClassName?: string
  stateMessageClassName?: string
}

type FormTabsControlProps = {
  tabs: AppTabItem<string>[]
  activeTab: string
  onTabChange: (value: string) => void
  ariaLabel?: string
  variant?: BaseTabsVariant
  fullWidth?: boolean
  listClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  inactiveTabClassName?: string
}

function FormTabsControl({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  variant,
  fullWidth,
  listClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
}: FormTabsControlProps) {
  const { error, formDescriptionId, formItemId, formMessageId } = useFormField()

  return (
    <AppTabs
      id={formItemId}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant={variant}
      fullWidth={fullWidth}
      ariaLabel={ariaLabel}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      listClassName={listClassName}
      tabClassName={tabClassName}
      activeTabClassName={activeTabClassName}
      inactiveTabClassName={inactiveTabClassName}
    />
  )
}

function FormTabsComponent<TFieldValues extends FieldValues = FieldValues>({
  name,
  tabs,
  label,
  ariaLabel,
  variant = 'pills',
  fullWidth,
  disabled,
  isLoading,
  loadingMessage = 'Loading...',
  emptyMessage = 'No options found',
  skeletonCount = 3,
  skeletonClassName,
  onChange,
  itemClassName,
  labelClassName,
  listClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  messageClassName,
  stateMessageClassName,
}: FormTabsProps<TFieldValues>) {
  const { clearErrors, control, setValue } = useFormContext<TFieldValues>()
  const selectedValue = useWatch({ control, name })

  const activeTab = selectedValue == null ? '' : String(selectedValue)
  const resolvedAriaLabel = ariaLabel ?? (typeof label === 'string' ? label : undefined)

  const renderedTabs = useMemo(() => {
    if (!disabled) {
      return tabs
    }

    return tabs.map((tab) => ({
      ...tab,
      disabled: true,
    }))
  }, [disabled, tabs])

  const handleTabChange = useCallback(
    (value: string) => {
      setValue(name, value as PathValue<TFieldValues, Path<TFieldValues>>, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      clearErrors(name)
      onChange?.(value)
    },
    [clearErrors, name, onChange, setValue]
  )

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className={itemClassName}>
          {label && <FormLabel className={labelClassName}>{label}</FormLabel>}

          {isLoading ? (
            <FormTabsSkeleton
              variant={variant}
              fullWidth={fullWidth}
              count={skeletonCount}
              loadingMessage={loadingMessage}
              listClassName={listClassName}
              tabClassName={tabClassName}
              skeletonClassName={skeletonClassName}
              stateMessageClassName={stateMessageClassName}
            />
          ) : renderedTabs.length > 0 ? (
            <FormTabsControl
              tabs={renderedTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              ariaLabel={resolvedAriaLabel}
              variant={variant}
              fullWidth={fullWidth}
              listClassName={listClassName}
              tabClassName={tabClassName}
              activeTabClassName={activeTabClassName}
              inactiveTabClassName={inactiveTabClassName}
            />
          ) : (
            <p className={cn('text-sm text-content-secondary', stateMessageClassName)}>{emptyMessage}</p>
          )}

          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  )
}
const SKELETON_TAB_WIDTHS = ['w-20', 'w-24', 'w-16', 'w-28'] as const

type FormTabsSkeletonProps = {
  variant: BaseTabsVariant
  fullWidth?: boolean
  count?: number
  loadingMessage?: ReactNode
  listClassName?: string
  tabClassName?: string
  skeletonClassName?: string
  stateMessageClassName?: string
}

export function FormTabsSkeleton({
  variant,
  fullWidth,
  count = 3,
  loadingMessage = 'Loading...',
  listClassName,
  tabClassName,
  skeletonClassName,
  stateMessageClassName,
}: FormTabsSkeletonProps) {
  const isUnderline = variant === 'underline'
  const isPills = variant === 'pills'

  return (
    <div role="status" aria-live="polite" className={cn('w-full min-w-0', stateMessageClassName)}>
      <span className="sr-only">{loadingMessage}</span>

      <div className={cn('w-full min-w-0 overflow-hidden', isUnderline && 'border-b border-border-subtle')}>
        <div
          className={cn(
            isUnderline && 'inline-flex min-w-max',
            fullWidth && isUnderline && 'md:grid md:min-w-0 md:w-full',
            fullWidth && isUnderline && count === 2 && 'md:grid-cols-2',
            fullWidth && isUnderline && count === 3 && 'md:grid-cols-3',
            fullWidth && isUnderline && count === 4 && 'md:grid-cols-4',

            isPills && 'inline-flex min-w-max items-center justify-center gap-3',

            listClassName
          )}
        >
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className={cn(
                'shrink-0 animate-pulse bg-surface-muted',

                isUnderline && 'h-12 rounded-md px-4 sm:h-14 sm:px-5 md:h-16',
                isPills && 'h-8 rounded-full px-4',

                SKELETON_TAB_WIDTHS[index % SKELETON_TAB_WIDTHS.length],
                tabClassName,
                skeletonClassName
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
export const FormTabs = memo(FormTabsComponent) as typeof FormTabsComponent
