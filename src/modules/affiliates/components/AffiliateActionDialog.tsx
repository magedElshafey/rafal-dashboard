import { useRef, useState, useId } from 'react'
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
import {
  useAffiliateAction,
  isAffiliateStatusConflict,
  type AffiliateManagementAction,
} from '@/modules/affiliates/hooks/useAffiliateAction'

export function AffiliateActionDialog({
  affiliateId,
  action,
  open,
  onOpenChange,
}: {
  affiliateId: number
  action: AffiliateManagementAction
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const lockRef = useRef(false)
  const [reason, setReason] = useState('')
  const reasonId = useId()
  const validReason =
    action === 'resetPassword' ||
    (action === 'suspend' ? reason.trim().length >= 10 && reason.trim().length <= 250 : Boolean(reason.trim()))
  const mutation = useAffiliateAction(affiliateId, action)

  const handleConfirm = async () => {
    if (lockRef.current || mutation.isPending || !validReason) return
    lockRef.current = true
    try {
      await mutation.mutateAsync(reason)
      onOpenChange(false)
    } catch (error) {
      // The hook owns safe localized feedback and conflict reconciliation.
      if (isAffiliateStatusConflict(error)) onOpenChange(false)
    } finally {
      lockRef.current = false
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <AlertDialogContent aria-busy={mutation.isPending}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`affiliates.confirm.${action}.title`)}</AlertDialogTitle>
          <AlertDialogDescription>{t(`affiliates.confirm.${action}.description`)}</AlertDialogDescription>
        </AlertDialogHeader>
        {action !== 'resetPassword' ? (
          <div className="space-y-2">
            <label htmlFor={reasonId}>{t('affiliates.fields.reason')}</label>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              maxLength={action === 'suspend' ? 250 : undefined}
              disabled={mutation.isPending}
              className="w-full rounded border p-2 focus-visible:outline-ring"
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>{t('affiliates.actions.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            variant={action === 'suspend' ? 'destructive' : 'default'}
            disabled={mutation.isPending || !validReason}
            onClick={() => void handleConfirm()}
          >
            {mutation.isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {t(`affiliates.actions.${mutation.isPending ? `${action}Pending` : action}`)}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
