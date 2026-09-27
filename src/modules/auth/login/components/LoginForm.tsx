import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInput } from '@/components/form/FormInput'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'
import type { LoginFormValues } from '@/modules/auth/login/types/login.types'

export const LoginForm = () => {
  const { t } = useTranslation()

  const {
    formState: { isSubmitting, isValid },
  } = useFormContext<LoginFormValues>()

  return (
    <div className={'space-y-3'}>
      <FormInput
        name={'email'}
        type={'email'}
        autoComplete={'username'}
        required
        label={t('label.email')}
        placeholder={t('label.enter_email')}
      />

      <FormPasswordInput
        name={'password'}
        autoComplete={'current-password'}
        aria-required={'true'}
        label={t('auth.fields.password')}
        placeholder={t('auth.fields.password_placeholder')}
      />

      <AuthSubmitButton
        className={'mt-7 w-full py-2 px-4 min-h-13 rounded-[10px]'}
        isLoading={isSubmitting}
        disabled={!isValid || isSubmitting}
      >
        {t('auth.login.submit')}
      </AuthSubmitButton>
    </div>
  )
}
