import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormPhoneInput } from '@/components/form'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'

import type { ForgotPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'

type ForgetPasswordFormProps = {
  isPending?: boolean
}

const ForgetPasswordForm = ({ isPending = false }: ForgetPasswordFormProps) => {
  const { t } = useTranslation()

  const {
    formState: { isSubmitting, isValid },
  } = useFormContext<ForgotPasswordFormValues>()

  const isLoading = isSubmitting || isPending
  const navigate = useNavigate()
  const handleNavigate = () => navigate(-1)
  return (
    <div className="space-y-5">
      <FormPhoneInput
        phoneName="phone"
        countryName="countryCode"
        label={t('auth.fields.phone')}
        placeholder={t('auth.fields.phone_placeholder')}
        labelClassName="text-neutral-800 text-base"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-10">
        <Button
          onClick={handleNavigate}
          type="button"
          variant="outline"
          className="min-h-12 w-full rounded-lg px-4 py-2 border-black-100 text-neutral-700"
        >
          {t('auth.common.back')}
        </Button>
        <AuthSubmitButton
          className="min-h-12 w-full rounded-lg px-4 py-2"
          isLoading={isLoading}
          disabled={!isValid || isLoading}
        >
          {t('auth.forgot_password.submit')}
        </AuthSubmitButton>
      </div>
    </div>
  )
}

export default ForgetPasswordForm
