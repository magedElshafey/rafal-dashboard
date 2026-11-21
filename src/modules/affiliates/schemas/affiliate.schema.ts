import * as yup from 'yup'

import type { AffiliateFormValues } from '@/modules/affiliates/types/affiliate.types'

export type AffiliateValidationMessages = {
  required: string
  emailInvalid: string
  mobileInvalid: string
  codeInvalid: string
  nameTooLong: string
  emailTooLong: string
  platformTooLong: string
  usernameTooLong: string
}

const SAUDI_MOBILE_PATTERN = /^(?:\+966|00966|966|0)?5\d{8}$/
const AFFILIATE_CODE_PATTERN = /^[A-Z0-9]{4,20}$/

export function createAffiliateSchema(messages: AffiliateValidationMessages): yup.ObjectSchema<AffiliateFormValues> {
  return yup.object({
    name: yup.string().trim().required(messages.required).max(150, messages.nameTooLong),
    mobile: yup.string().trim().required(messages.required).matches(SAUDI_MOBILE_PATTERN, messages.mobileInvalid),
    email: yup.string().trim().required(messages.required).email(messages.emailInvalid).max(254, messages.emailTooLong),
    platform: yup.string().trim().required(messages.required).max(50, messages.platformTooLong),
    username: yup.string().trim().required(messages.required).max(100, messages.usernameTooLong),
    code: yup.string().trim().required(messages.required).matches(AFFILIATE_CODE_PATTERN, messages.codeInvalid),
  })
}
