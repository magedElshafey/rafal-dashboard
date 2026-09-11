import { memo, type ReactNode } from 'react'

import { BaseTabs } from './BaseTabs'
import type { BaseTabItem, BaseTabsVariant } from './types'

type AriaInvalid = boolean | 'false' | 'true' | 'grammar' | 'spelling'

export type AppTabItem<TValue extends string> = BaseTabItem<TValue>

type AppTabsProps<TValue extends string> = {
  tabs: AppTabItem<TValue>[]
  activeTab: TValue
  onTabChange: (tab: TValue) => void
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

function AppTabsComponent<TValue extends string>({
  tabs,
  activeTab,
  onTabChange,
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
}: AppTabsProps<TValue>) {
  return (
    <BaseTabs
      tabs={tabs}
      activeValue={activeTab}
      onValueChange={onTabChange}
      variant={variant}
      fullWidth={fullWidth}
      label={label}
      ariaLabel={ariaLabel}
      className={className}
      listClassName={listClassName}
      tabClassName={tabClassName}
      activeTabClassName={activeTabClassName}
      inactiveTabClassName={inactiveTabClassName}
      labelClassName={labelClassName}
      id={id}
      panelId={panelId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
    />
  )
}

export const AppTabs = memo(AppTabsComponent) as typeof AppTabsComponent
