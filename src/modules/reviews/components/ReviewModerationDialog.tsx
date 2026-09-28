import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { useModerateReview } from '@/modules/reviews/hooks/useModerateReview'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'

export type ReviewModerationTargetState = {
  id: number
  reviewerName: string
  productName: string
  status: ReviewModerationTarget
}

type Props = {
  target: ReviewModerationTargetState | null
  onClose: () => void
}

export function ReviewModerationDialog({ target, onClose }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<DeleteAlertRef>(null)
  const submissionLockRef = useRef(false)
  const mutation = useModerateReview()

  useEffect(() => {
    if (target) dialogRef.current?.handleOpen(true)
  }, [target])

  const handleConfirm = async () => {
    if (!target || mutation.isPending || submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      await mutation.mutateAsync({ id: target.id, status: target.status })
      dialogRef.current?.close()
      onClose()
    } catch {
      // The hook owns safe localized feedback; keep the dialog open for retry.
    } finally {
      submissionLockRef.current = false
    }
  }

  const action = target?.status === 'approved' ? 'approve' : 'reject'

  return (
    <DeleteAlert
      ref={dialogRef}
      title={t(`reviews.confirm.${action}.title`)}
      body={t(`reviews.confirm.${action}.description`, {
        name: target?.reviewerName ?? '',
        product: target?.productName ?? '',
        id: target?.id ?? '',
      })}
      confirmLabel={t(`reviews.actions.${action}`)}
      cancelLabel={t('reviews.actions.cancel')}
      pendingLabel={t(`reviews.actions.${action}Pending`)}
      isPending={mutation.isPending}
      disabled={!target}
      onDelete={handleConfirm}
      onCancel={onClose}
    />
  )
}
