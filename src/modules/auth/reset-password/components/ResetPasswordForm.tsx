import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'

import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { PASSWORD_MAX_LENGTH } from '@/lib/password-policy'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'

import type { ResetPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'

type ResetPasswordFormProps = {
  isLoading: boolean
}

const ResetPasswordForm = memo(function ResetPasswordForm({ isLoading }: ResetPasswordFormProps) {
  const { t } = useTranslation()

  const {
    formState: { isValid },
  } = useFormContext<ResetPasswordFormValues>()

  return (
    <div className="space-y-5">
      <FormPasswordInput
        name="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        aria-required="true"
        label={t('auth.fields.password')}
        placeholder={t('auth.fields.password_placeholder')}
      />

      <FormPasswordInput
        name="passwordConfirmation"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        aria-required="true"
        label={t('auth.fields.password_confirmation')}
        placeholder={t('auth.fields.password_placeholder')}
      />

      <AuthSubmitButton
        className="min-h-11 w-full rounded-lg mt-10 px-4 py-2"
        isLoading={isLoading}
        disabled={!isValid || isLoading}
      >
        {t('auth.reset_password.save')}
      </AuthSubmitButton>
    </div>
  )
})

export default ResetPasswordForm
