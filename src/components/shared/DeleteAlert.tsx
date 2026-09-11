import { forwardRef, useCallback, useImperativeHandle, useState, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export interface DeleteAlertRef {
  open: boolean
  handleOpen: (value: boolean) => void
  close: () => void
}

interface DeleteAlertProps {
  title: ReactNode
  body: ReactNode

  isPending?: boolean
  disabled?: boolean

  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  pendingLabel?: ReactNode

  onDelete: () => void | Promise<void>
  onCancel?: () => void
}

const DeleteAlert = forwardRef<DeleteAlertRef, DeleteAlertProps>(
  (
    { title, body, isPending = false, disabled = false, confirmLabel, cancelLabel, pendingLabel, onDelete, onCancel },
    ref
  ) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    /**
     * Used for normal user interactions.
     * Prevents closing while the delete request is pending.
     */
    const handleOpen = useCallback(
      (value: boolean) => {
        if (!value && isPending) {
          return
        }

        setOpen(value)
      },
      [isPending]
    )

    /**
     * Used programmatically after a successful delete.
     * It intentionally bypasses the pending guard.
     */
    const close = useCallback(() => {
      setOpen(false)
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        open,
        handleOpen,
        close,
      }),
      [close, handleOpen, open]
    )

    const handleCancel = () => {
      if (isPending) {
        return
      }

      onCancel?.()
      setOpen(false)
    }

    const handleConfirm = () => {
      if (isPending || disabled) {
        return
      }

      void onDelete()
    }

    const isActionDisabled = disabled || isPending

    return (
      <AlertDialog open={open} onOpenChange={handleOpen}>
        <AlertDialogContent
          aria-busy={isPending}
          onEscapeKeyDown={(event) => {
            if (isPending) {
              event.preventDefault()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div>{body}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} onClick={handleCancel}>
              {cancelLabel ?? t('button.cancel')}
            </AlertDialogCancel>

            {/*
             * Button is used instead of AlertDialogAction because
             * AlertDialogAction closes the dialog immediately.
             */}
            <Button type="button" variant="destructive" disabled={isActionDisabled} onClick={handleConfirm}>
              {isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}

              {isPending ? (pendingLabel ?? t('button.deleting')) : (confirmLabel ?? t('button.confirm'))}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

DeleteAlert.displayName = 'DeleteAlert'

export default DeleteAlert
