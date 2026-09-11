import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import type { LoginFormValues } from '@/modules/auth/login/types/login.types'

export const LoginForm = () => {
  const { t } = useTranslation()

  const {
    formState: { isSubmitting, isValid },
  } = useFormContext<LoginFormValues>()

  return (
    <div className="space-y-3">
      <FormPhoneInput
        phoneName="phone"
        countryName="countryCode"
        label={t('auth.fields.phone')}
        placeholder={t('auth.fields.phone_placeholder')}
      />

      <FormPasswordInput
        name="password"
        autoComplete="current-password"
        aria-required="true"
        label={t('auth.fields.password')}
        placeholder={t('auth.fields.password_placeholder')}
      />

      <div className="mt-5 mb-10">
        <FormCheckbox name="rememberMe" label={t('auth.login.remember_me')} />
      </div>

      <AuthSubmitButton
        className="w-full py-2 px-4 min-h-13 rounded-[10px]"
        isLoading={isSubmitting}
        disabled={!isValid}
      >
        {t('auth.login.submit')}
      </AuthSubmitButton>
    </div>
  )
}
