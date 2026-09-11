import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReactNode, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'

type DashboardFormActionsProps = {
  submitLabel?: ReactNode
  cancelLabel?: ReactNode
  submitClassName?: string
  cancelClassName?: string
  onCancel?: () => void
  disableSubmit?: boolean
}

export const DashboardFormActions = ({
  submitLabel = 'submit',
  cancelLabel = 'cancel',
  submitClassName,
  cancelClassName,
  onCancel,
  disableSubmit = false,
}: DashboardFormActionsProps) => {
  const { reset } = useFormContext()

  const handleReset = useCallback(() => {
    reset()
    onCancel?.()
  }, [onCancel, reset])

  return (
    <div className="flex flex-wrap justify-center flex-col-reverse mt-6 md:flex-row gap-3 md:justify-end">
      <Button
        variant="ghost"
        className={cn('border border-border-strong h-12 px-5 py-2 font-medium text-sm', cancelClassName)}
        type="button"
        onClick={handleReset}
      >
        {cancelLabel}
      </Button>

      <Button
        disabled={disableSubmit}
        className={cn('h-12 px-5 py-2 font-medium text-sm', submitClassName)}
        type="submit"
      >
        {submitLabel}
      </Button>
    </div>
  )
}
