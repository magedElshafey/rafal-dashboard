import type { LucideIcon } from 'lucide-react'

export type CardActionVariant = 'default' | 'destructive' | 'success'

export type CardActionItem = {
  /**
   * Stable unique identifier.
   * Examples: view, edit, delete, duplicate.
   */
  readonly id: string

  /**
   * Visible accessible label.
   */
  readonly label: string

  /** Accessible label when the visible copy should stay compact. */
  readonly accessibleLabel?: string

  /**
   * Lucide icon related to the action.
   */
  readonly icon: LucideIcon

  /**
   * Action handler.
   */
  readonly onClick: () => void | Promise<void>

  /**
   * Hide the action completely.
   * Useful for permissions and conditional actions.
   */
  readonly hidden?: boolean

  /**
   * Show the action but prevent interaction.
   */
  readonly disabled?: boolean

  /**
   * Indicates an ongoing async action.
   */
  readonly isLoading?: boolean

  /**
   * Destructive is suitable for delete/remove actions.
   */
  readonly variant?: CardActionVariant
}

/**
 * `auto` preserves the compact, direct trigger used for a single action.
 * `menu` always renders the actions inside an overflow menu.
 */
export type DashboardCardActionTriggerMode = 'auto' | 'menu'

export type DashboardCardActionsProps = {
  readonly actions: readonly CardActionItem[]
  readonly className?: string
  readonly disabled?: boolean
  readonly align?: 'start' | 'center' | 'end'
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly sideOffset?: number
  /** Accessible name for the overflow trigger. Prefer a resource-specific label. */
  readonly triggerLabel?: string
  /** Preserve the direct single-action trigger by default, or always display the overflow menu. */
  readonly triggerMode?: DashboardCardActionTriggerMode
}
