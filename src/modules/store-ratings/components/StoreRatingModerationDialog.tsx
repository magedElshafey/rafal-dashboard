import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { useModerateStoreRating } from '../hooks/useModerateStoreRating'

export type StoreRatingModerationTarget = { id: number; name: string; order: string; status: ReviewModerationTarget }

export function StoreRatingModerationDialog({
  target,
  onClose,
}: {
  target: StoreRatingModerationTarget | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const ref = useRef<DeleteAlertRef>(null)
  const lock = useRef(false)
  const mutation = useModerateStoreRating()
  useEffect(() => {
    if (target) ref.current?.handleOpen(true)
  }, [target])
  const confirm = async () => {
    if (!target || mutation.isPending || lock.current) return
    lock.current = true
    try {
      await mutation.mutateAsync({ id: target.id, status: target.status })
      ref.current?.close()
      onClose()
    } catch {
      // The mutation owns safe feedback. Keep the confirmation available for retry.
    } finally {
      lock.current = false
    }
  }
  const action = target?.status === 'approved' ? 'approve' : 'reject'
  return (
    <DeleteAlert
      ref={ref}
      title={t(`storeRatings.confirm.${action}.title`)}
      body={t(`storeRatings.confirm.${action}.description`, {
        name: target?.name ?? '',
        order: target?.order ?? '',
        id: target?.id ?? '',
      })}
      confirmLabel={t(`reviews.actions.${action}`)}
      cancelLabel={t('reviews.actions.cancel')}
      pendingLabel={t(`reviews.actions.${action}Pending`)}
      isPending={mutation.isPending}
      disabled={!target}
      onDelete={confirm}
      onCancel={onClose}
    />
  )
}
