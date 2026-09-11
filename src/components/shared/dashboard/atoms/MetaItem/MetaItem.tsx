import type { ReactNode } from 'react'

import { InfoRow } from '@/components/shared/data-display/InfoRow'

import type { MetaItemProps } from './meta-item.types'
import { cn } from '@/lib/utils'

type MetaItemLabelProps = Pick<
  MetaItemProps,
  'icon' | 'label' | 'iconClassName' | 'labelTextClassName' | 'labelContainerClassName'
>

const META_ITEM_STYLES = {
  root: 'gap-1',
  labelContainer: 'flex items-center gap-x-1',
  icon: 'size-4 shrink-0 text-content-secondary',
  label: 'text-xs text-content-tertiary',
  value: 'text-sm font-medium text-content-primary',
} as const

export function MetaItem({
  label,
  value,
  orientation = 'horizontal',
  className,
  iconClassName,
  labelTextClassName,
  labelContainerClassName,
  rowLabelClassName,
  valueClassName,
}: MetaItemProps) {
  return (
    <InfoRow
      className={cn(META_ITEM_STYLES.root, className)}
      orientation={orientation}
      labelClassName={rowLabelClassName}
      label={
        <MetaItemLabel
          label={label}
          iconClassName={iconClassName}
          labelTextClassName={labelTextClassName}
          labelContainerClassName={labelContainerClassName}
        />
      }
      value={value}
      valueClassName={cn(META_ITEM_STYLES.value, valueClassName)}
    />
  )
}

function MetaItemLabel({
  icon: Icon,
  label,
  iconClassName,
  labelTextClassName,
  labelContainerClassName,
}: MetaItemLabelProps) {
  const hasLabel = hasRenderableNode(label)

  if (!Icon && !hasLabel) return null

  return (
    <div className={cn(META_ITEM_STYLES.labelContainer, labelContainerClassName)}>
      {Icon && <Icon className={cn(META_ITEM_STYLES.icon, iconClassName)} aria-hidden="true" />}

      {hasLabel && <span className={cn(META_ITEM_STYLES.label, labelTextClassName)}>{label}</span>}
    </div>
  )
}

function hasRenderableNode(node: ReactNode) {
  return node !== null && node !== undefined && node !== false
}
