import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { CircleCheck } from 'lucide-react'

type ResetPasswordSuccessDialogProps = {
  open: boolean
  loginPath?: string
  onBeforeNavigate?: () => void
}

export const ResetPasswordSuccessDialog = memo(function ResetPasswordSuccessDialog({
  open,
  loginPath = '/user/login',
  onBeforeNavigate,
}: ResetPasswordSuccessDialogProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleBackToSignIn() {
    onBeforeNavigate?.()
    navigate(loginPath, { replace: true })
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault()
        }}
        onInteractOutside={(event) => {
          event.preventDefault()
        }}
        className="
          w-[calc(100%-32px)] max-w-186 rounded-xl border-0 bg-surface-card p-0 shadow-dropdown
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
        "
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-12 sm:pb-7 md:px-17">
          <DashboardIcon
            icon={CircleCheck}
            className="size-20 bg-success-50 text-success-500 mb-4"
            iconClassName="size-12"
          />

          <DialogTitle className="text-lg font-semibold  text-neutral-800">
            {t('auth.reset_password.success_dialog.title')}
          </DialogTitle>

          <DialogDescription className="font-normal text-neutral-600">
            {t('auth.reset_password.success_dialog.description')}
          </DialogDescription>

          <Button
            type="button"
            className="mt-6 h-12 w-full rounded-lg bg-primary text-base font-semibold text-white hover:bg-brand-800"
            onClick={handleBackToSignIn}
          >
            {t('auth.reset_password.success_dialog.back_to_sign_in')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})
