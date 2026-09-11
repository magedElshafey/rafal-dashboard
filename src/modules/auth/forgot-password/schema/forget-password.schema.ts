import { object, string } from 'yup'
import { t } from '@/modules/auth/schema'
import { GENERIC_PHONE_PATTERN } from '@/utils/phone/phone.helpers'

export const ForgotPasswordSchema = object({
  countryCode: string().trim().default('+20'),

  phone: string()
    .trim()
    .required(() => t('auth.validation.phone_required'))
    .matches(GENERIC_PHONE_PATTERN, () => t('auth.validation.phone_invalid')),
})
