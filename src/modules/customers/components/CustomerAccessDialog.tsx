import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { useCustomerAccessMutation } from '@/modules/customers/hooks/useCustomerAccessMutation'
import type { CustomerAccessAction } from '@/modules/customers/types/customer.types'

export type CustomerAccessTarget = {
  id: number
  displayName: string
  action: CustomerAccessAction
}

type Props = {
  target: CustomerAccessTarget | null
  onClose: () => void
}

export function CustomerAccessDialog({ target, onClose }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<DeleteAlertRef>(null)
  const submissionLockRef = useRef(false)
  const mutation = useCustomerAccessMutation()

  useEffect(() => {
    if (target) dialogRef.current?.handleOpen(true)
  }, [target])

  const handleConfirm = async () => {
    if (!target || mutation.isPending || submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      await mutation.mutateAsync({ id: target.id, action: target.action })
      dialogRef.current?.close()
      onClose()
    } catch {
      // The hook owns safe localized feedback; keep the dialog open for retry.
    } finally {
      submissionLockRef.current = false
    }
  }

  const action = target?.action ?? 'block'

  return (
    <DeleteAlert
      ref={dialogRef}
      title={t(`customers.confirm.${action}.title`)}
      body={t(`customers.confirm.${action}.description`, { name: target?.displayName ?? '' })}
      confirmLabel={t(`customers.actions.${action}`)}
      cancelLabel={t('customers.actions.cancel')}
      pendingLabel={t(`customers.actions.${action}Pending`)}
      isPending={mutation.isPending}
      disabled={!target}
      onDelete={handleConfirm}
      onCancel={onClose}
    />
  )
}
