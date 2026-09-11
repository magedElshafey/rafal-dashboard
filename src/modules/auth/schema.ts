import { string } from 'yup'
import { getI18n } from 'react-i18next'
import type { TOptions } from 'i18next'

import {
  createNewPasswordSchema,
  createPasswordConfirmationSchema,
  createPasswordPolicyMessages,
} from '@/lib/password-policy'

export const t = (key: string, options?: TOptions) => getI18n().t(key, options)

export const email = string()
  .trim()
  .required(() => t('auth.validation.email_required'))
  .email(() => t('auth.validation.email_invalid'))

const authPasswordMessages = createPasswordPolicyMessages(
  (key, options) => t(key, options),
  () => t('auth.validation.password_required')
)

export const passwordSchema = createNewPasswordSchema(authPasswordMessages)

export const passwordConfirmationSchema = createPasswordConfirmationSchema('password', {
  required: () => t('auth.validation.password_confirmation_required'),
  mismatch: () => t('auth.validation.password_match'),
  maximumLength: authPasswordMessages.maximumLength,
})
