import { useTranslation } from 'react-i18next'

import { AuthLayout } from '@/modules/auth/layout/AuthLayout'
import { FormWrapper } from '@/components/core/FormWrapper'
import ResetPasswordForm from '@/modules/auth/reset-password/components/ResetPasswordForm'
import { RequireResetPasswordFlowData } from '@/modules/auth/guards/RequireResetPasswordFlowData'
import useResetPasswordActions from '@/modules/auth/reset-password/containers/useResetPasswordActions'
import { ResetPasswordSchema } from '@/modules/auth/reset-password/schema/reset-password.schema'

import type { ResetPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'
import { ResetPasswordSuccessDialog } from '@/modules/auth/reset-password/components/ResetPasswordSuccessDialog'

const ResetPasswordPage = () => {
  return (
    <RequireResetPasswordFlowData>
      <ResetPasswordPageContent />
    </RequireResetPasswordFlowData>
  )
}

const ResetPasswordPageContent = () => {
  const { t } = useTranslation()

  const { defaultValues, onSubmit, loginPath, isSuccessDialogOpen, handleSuccessConfirm, isLoading } =
    useResetPasswordActions()

  return (
    <>
      <AuthLayout title={t('auth.reset_password.title')} description={t('auth.reset_password.description')}>
        <FormWrapper<ResetPasswordFormValues>
          schema={ResetPasswordSchema}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          validationMode="onChange"
        >
          <ResetPasswordForm isLoading={isLoading} />
        </FormWrapper>
      </AuthLayout>

      <ResetPasswordSuccessDialog
        open={isSuccessDialogOpen}
        loginPath={loginPath}
        onBeforeNavigate={handleSuccessConfirm}
      />
    </>
  )
}

export default ResetPasswordPage
