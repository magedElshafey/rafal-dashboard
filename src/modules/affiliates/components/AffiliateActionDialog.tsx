import { useRef } from 'react'
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
  const mutation = useAffiliateAction(affiliateId, action)

  const handleConfirm = async () => {
    if (lockRef.current || mutation.isPending) return
    lockRef.current = true
    try {
      await mutation.mutateAsync()
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
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>{t('affiliates.actions.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            variant={action === 'suspend' ? 'destructive' : 'default'}
            disabled={mutation.isPending}
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
