import { object, string } from 'yup'
import { t } from '@/modules/auth/schema'

export const LoginSchema = object({
  email: string()
    .trim()
    .email(() => t('auth.validation.email_invalid'))
    .required(() => t('auth.validation.email_required')),

  password: string().required(() => t('auth.validation.password_required')),
})
