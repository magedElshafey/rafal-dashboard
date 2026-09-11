import { useTranslation } from 'react-i18next'

import { AuthLayout } from '@/modules/auth/layout/AuthLayout'
import { FormWrapper } from '@/components/core/FormWrapper'
import OtpForm from '@/modules/auth/otp/components/OtpForm'
import useOtpActions from '@/modules/auth/otp/containers/useOtpActions'
import { OtpSchema } from '@/modules/auth/otp/schema/otp.schema'

import type { OtpFormValues } from '@/modules/auth/otp/types/otp.types'
import { RequireOtpFlowData } from '@/modules/auth/guards/RequireFlowData'

const OtpPage = () => {
  return (
    <RequireOtpFlowData>
      <OtpPageContent />
    </RequireOtpFlowData>
  )
}

const OtpPageContent = () => {
  const { t } = useTranslation()

  const { phone, countryCode, defaultValues, onSubmit, resendCode, onChangePhone, isLoading, isResending } =
    useOtpActions()

  if (!phone || !countryCode) {
    return null
  }

  return (
    <AuthLayout title={t('auth.otp.title')} description={t('auth.otp.description')}>
      <FormWrapper<OtpFormValues> schema={OtpSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
        <OtpForm
          phone={phone}
          countryCode={countryCode}
          onResend={resendCode}
          onChangePhone={onChangePhone}
          isLoading={isLoading}
          isResending={isResending}
        />
      </FormWrapper>
    </AuthLayout>
  )
}

export default OtpPage
