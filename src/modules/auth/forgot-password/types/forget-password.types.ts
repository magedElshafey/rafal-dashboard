import type { LoginFormValues } from '@/modules/auth/login/types/login.types'

export type ForgotPasswordFormValues = Omit<LoginFormValues, 'password' | 'rememberMe'>

export type ForgotPasswordPayload = {
  phone: string
  countryCode: string
}

export type ForgotPasswordResponse = {
  message: string
}

export type ResetPasswordFormValues = {
  password: string
  passwordConfirmation: string
}

export type ResetPasswordPayload = {
  resetToken: string
  password: string
  passwordConfirmation: string
}

export type ResetPasswordResponse = {
  message: string
}
