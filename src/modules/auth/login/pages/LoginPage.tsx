import { AuthLayout } from '@/modules/auth/layout/AuthLayout'
import { FormWrapper } from '@/components/core/FormWrapper'
import { LoginForm } from '@/modules/auth/login/components/LoginForm'
import { LoginSchema } from '@/modules/auth/login/schema/login.schema'
import useLoginActions from '@/modules/auth/login/containers/useLoginActions'
import { useTranslation } from 'react-i18next'

import type { LoginFormValues } from '@/modules/auth/login/types/login.types'

const LoginPage = () => {
  const { t } = useTranslation()
  const { defaultValues, onSubmit, portal } = useLoginActions()

  const contentKey = portal ?? 'default'

  return (
    <AuthLayout title={t(`auth.login.${contentKey}.title`)} description={t(`auth.login.${contentKey}.description`)}>
      <FormWrapper<LoginFormValues> schema={LoginSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
        <LoginForm />
      </FormWrapper>
    </AuthLayout>
  )
}

export default LoginPage
