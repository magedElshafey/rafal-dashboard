import { object, string } from 'yup'

import { t } from '@/modules/auth/schema'
import { OTP_LENGTH } from '@/modules/auth/otp/constants/otp.constants'

export const OtpSchema = object({
  code: string()
    .required(() => t('auth.otp.code_required'))
    .length(OTP_LENGTH, () => t('auth.otp.code_length', { length: OTP_LENGTH }))
    .matches(/^\d+$/, () => t('auth.otp.code_digits_only')),
})
