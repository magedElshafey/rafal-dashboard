import type { ReactNode } from 'react'

export type EntityFormDrawerMode = 'create' | 'edit'

export type EntityFormDrawerModeContent<TMode extends EntityFormDrawerMode> = Record<TMode, ReactNode>

export type EntityFormDrawerProps<TMode extends EntityFormDrawerMode = EntityFormDrawerMode> = {
  open: boolean
  mode: TMode
  onOpenChange: (open: boolean) => void

  titles: EntityFormDrawerModeContent<TMode>
  descriptions?: Partial<EntityFormDrawerModeContent<TMode>>
  submitLabels: EntityFormDrawerModeContent<TMode>
  createAnotherLabel?: ReactNode

  cancelLabel: ReactNode
  closeLabel: string

  children: ReactNode

  formId?: string
  onSubmit?: () => void
  onSubmitAndCreateAnother?: () => void
  onCancel?: () => void

  isLoading?: boolean
  isSubmitting?: boolean
  isSubmitDisabled?: boolean
  preventClose?: boolean

  loadingContent?: ReactNode
  errorContent?: ReactNode
  headerActions?: ReactNode
  footer?: ReactNode | null

  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  footerStatus?: ReactNode
}
