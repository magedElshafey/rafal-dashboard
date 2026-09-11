export type OtpFormValues = {
  code: string
}

export type VerifyResetOtpPayload = {
  phone: string
  countryCode: string
  code: string
}

export type VerifyResetOtpResponse = {
  message?: string
  reset_token?: string
  resetToken?: string
}
