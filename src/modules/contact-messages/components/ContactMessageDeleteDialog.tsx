import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'
import { useDeleteContactMessage } from '../hooks/useContactMessages'
import type { ContactMessage } from '../types/contact-message.types'

export function ContactMessageDeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: ContactMessage
  onClose: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const alert = useRef<DeleteAlertRef>(null)
  const lock = useRef(false)
  const mutation = useDeleteContactMessage(target.id)
  useEffect(() => {
    alert.current?.handleOpen(true)
  }, [])
  const remove = async () => {
    if (lock.current || mutation.isPending) return
    lock.current = true
    try {
      await mutation.mutateAsync()
      alert.current?.close()
      onDeleted()
    } catch {
      // The dialog renders safe mutation feedback and stays open for retry.
    } finally {
      lock.current = false
    }
  }
  return (
    <DeleteAlert
      ref={alert}
      title={t('contactMessages.deleteTitle', { id: target.id })}
      body={
        <>
          <p>{t('contactMessages.deleteDescription')}</p>
          <p className="mt-2 break-words" dir="auto">
            {target.subject}
          </p>
          {mutation.error ? (
            <p role="alert" className="mt-2 text-destructive">
              {getApiErrorMessage(mutation.error, t('contactMessages.feedback.deleteError'))}
            </p>
          ) : null}
        </>
      }
      isPending={mutation.isPending}
      confirmLabel={t('contactMessages.confirmDelete')}
      cancelLabel={t('contactMessages.cancel')}
      pendingLabel={t('contactMessages.deleting')}
      onDelete={remove}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    />
  )
}
