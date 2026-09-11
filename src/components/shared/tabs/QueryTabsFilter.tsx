import { memo, type ReactNode, useCallback, useMemo } from 'react'

import { useQuery } from '@/store/queryContext/useQueryContext'
import type { QueryUpdateOptions } from '@/store/queryContext/types'

import { BaseTabs } from './BaseTabs'
import type { BaseTabItem, BaseTabsVariant } from './types'

export type QueryTabsFilterItem = IDDl & {
  count?: number
  disabled?: boolean
}

export type QueryTabsFilterProps<TItem extends object = QueryTabsFilterItem> = {
  name: string
  label?: ReactNode
  ariaLabel?: string

  tabs: TItem[]

  valueKey?: keyof TItem
  labelKey?: keyof TItem
  countKey?: keyof TItem
  disabledKey?: keyof TItem

  value?: string
  defaultValue?: string
  clearValue?: string
  allowClear?: boolean

  queryUpdateOptions?: QueryUpdateOptions

  className?: string
  listClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  inactiveTabClassName?: string
  labelClassName?: string
  id?: string
  panelId?: string

  onValueChange?: (value: string) => void

  fullWidth?: boolean
  variant?: BaseTabsVariant
}

function QueryTabsFilterComponent<TItem extends object = QueryTabsFilterItem>({
  name,
  label,
  ariaLabel,
  tabs,

  value: controlledValue,

  valueKey,
  labelKey,
  countKey,
  disabledKey,

  defaultValue,
  clearValue,
  allowClear = false,

  queryUpdateOptions,

  className,
  listClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  labelClassName,
  id,
  panelId,

  variant = 'segmented',
  fullWidth,

  onValueChange,
}: QueryTabsFilterProps<TItem>) {
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery } = useQuery()

  const normalizedTabs = useMemo<BaseTabItem<string>[]>(() => {
    const resolvedValueKey = (valueKey ?? 'value') as keyof TItem

    const resolvedLabelKey = (labelKey ?? 'label') as keyof TItem

    const resolvedCountKey = (countKey ?? 'count') as keyof TItem

    const resolvedDisabledKey = (disabledKey ?? 'disabled') as keyof TItem

    return tabs.map((tab) => {
      const rawValue = tab[resolvedValueKey]
      const rawLabel = tab[resolvedLabelKey]
      const rawCount = tab[resolvedCountKey]
      const rawDisabled = tab[resolvedDisabledKey]

      const value = rawValue == null ? '' : String(rawValue)

      return {
        value,
        label: (rawLabel ?? value) as ReactNode,
        count: typeof rawCount === 'number' ? rawCount : undefined,
        disabled: Boolean(rawDisabled),
      }
    })
  }, [countKey, disabledKey, labelKey, tabs, valueKey])

  const queryValue = forwardQuery?.[name]

  const hasAvailableValue = (candidate: string | undefined): candidate is string =>
    candidate !== undefined && normalizedTabs.some((tab) => tab.value === candidate && !tab.disabled)

  const activeValue =
    (hasAvailableValue(controlledValue) ? controlledValue : undefined) ??
    (hasAvailableValue(queryValue) ? queryValue : undefined) ??
    (hasAvailableValue(defaultValue) ? defaultValue : undefined) ??
    normalizedTabs.find((tab) => !tab.disabled)?.value ??
    ''

  const handleTabChange = useCallback(
    (value: string) => {
      const isCurrentActiveTab = value === activeValue

      const shouldClear = !value || value === clearValue || (allowClear && isCurrentActiveTab)

      if (!shouldClear && isCurrentActiveTab) {
        return
      }

      if (shouldClear && isCurrentActiveTab && queryValue === undefined) {
        return
      }

      if (shouldClear) {
        forwardDeleteQuery(name, queryUpdateOptions)
      } else {
        forwardAddQuery(
          {
            [name]: value,
          },
          queryUpdateOptions
        )
      }

      onValueChange?.(value)
    },
    [
      activeValue,
      allowClear,
      clearValue,
      forwardAddQuery,
      forwardDeleteQuery,
      name,
      onValueChange,
      queryUpdateOptions,
      queryValue,
    ]
  )

  return (
    <BaseTabs
      tabs={normalizedTabs}
      activeValue={activeValue}
      onValueChange={handleTabChange}
      variant={variant}
      label={label}
      ariaLabel={ariaLabel ?? name}
      className={className}
      listClassName={listClassName}
      tabClassName={tabClassName}
      activeTabClassName={activeTabClassName}
      inactiveTabClassName={inactiveTabClassName}
      labelClassName={labelClassName}
      id={id}
      panelId={panelId}
      fullWidth={fullWidth}
    />
  )
}

export const QueryTabsFilter = memo(QueryTabsFilterComponent) as typeof QueryTabsFilterComponent

export default QueryTabsFilter
