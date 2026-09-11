import { object } from 'yup'

import {
  createNewPasswordSchema,
  createPasswordConfirmationSchema,
  createPasswordPolicyMessages,
} from '@/lib/password-policy'
import { t } from '@/modules/auth/schema'

const resetPasswordMessages = createPasswordPolicyMessages(
  (key, options) => t(key, options),
  () => t('auth.reset_password.password_required')
)

export const ResetPasswordSchema = object({
  password: createNewPasswordSchema(resetPasswordMessages),

  passwordConfirmation: createPasswordConfirmationSchema('password', {
    required: () => t('auth.reset_password.password_confirmation_required'),
    mismatch: () => t('auth.reset_password.passwords_not_match'),
    maximumLength: resetPasswordMessages.maximumLength,
  }),
})
