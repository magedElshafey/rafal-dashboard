import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import type { LoginFormValues } from '@/modules/auth/login/types/login.types'
import { PortalLink } from '@/components/core/portal-link/components/PortalLink'

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

      <div className="flex items-center justify-between gap-4 text-sm mt-5 mb-10">
        <FormCheckbox name="rememberMe" label={t('auth.login.remember_me')} />

        <PortalLink
          className="text-sm  text-neutral-900 underline underline-offset-2 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
          to="/forget-password"
        >
          {t('auth.login.forgot_password')}
        </PortalLink>
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
