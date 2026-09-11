import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import ForgetPasswordForm from '@/modules/auth/forgot-password/components/ForgetPasswordForm'
import useForgotPasswordActions from '@/modules/auth/forgot-password/containers/useForgotPasswordActions'
import { ForgotPasswordSchema } from '@/modules/auth/forgot-password/schema/forget-password.schema'
import { ForgotPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'
import { AuthLayout } from '@/modules/auth/layout/AuthLayout'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const { onSubmit, defaultValues, isPending } = useForgotPasswordActions()

  return (
    <AuthLayout title={t('auth.forgot_password.title')} description={t('auth.forgot_password.description')}>
      <FormWrapper<ForgotPasswordFormValues>
        schema={ForgotPasswordSchema}
        onSubmit={onSubmit}
        defaultValues={defaultValues}
      >
        <ForgetPasswordForm isPending={isPending} />
      </FormWrapper>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
