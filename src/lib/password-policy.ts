import { ref, string, type StringSchema } from 'yup'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 20

export const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9\s]/,
} as const

export const PASSWORD_POLICY_MESSAGE_KEYS = {
  minimumLength: 'validations.password_minimum_length',
  maximumLength: 'validations.password_maximum_length',
  uppercase: 'validations.password_uppercase',
  lowercase: 'validations.password_lowercase',
  number: 'validations.password_number',
  symbol: 'validations.password_special_character',
} as const

export type PasswordValidationMessage = string | (() => string)

export type PasswordPolicyMessages = {
  required: PasswordValidationMessage
  minimumLength: PasswordValidationMessage
  maximumLength: PasswordValidationMessage
  uppercase: PasswordValidationMessage
  lowercase: PasswordValidationMessage
  number: PasswordValidationMessage
  symbol: PasswordValidationMessage
}

export type PasswordConfirmationMessages = {
  required: PasswordValidationMessage
  mismatch: PasswordValidationMessage
  maximumLength: PasswordValidationMessage
}

type PasswordPolicyTranslator = (key: string, options?: Record<string, number>) => string

type NewPasswordSchemaOptions = {
  required?: boolean
  minimumLength?: number
}

type PasswordConfirmationSchemaOptions = {
  required?: boolean
}

export function createPasswordPolicyMessages(
  translate: PasswordPolicyTranslator,
  required: PasswordValidationMessage,
  minimumLength = PASSWORD_MIN_LENGTH
): PasswordPolicyMessages {
  return {
    required,
    minimumLength: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.minimumLength, { min: minimumLength }),
    maximumLength: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.maximumLength, { max: PASSWORD_MAX_LENGTH }),
    uppercase: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.uppercase),
    lowercase: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.lowercase),
    number: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.number),
    symbol: () => translate(PASSWORD_POLICY_MESSAGE_KEYS.symbol),
  }
}

export function createNewPasswordSchema(
  messages: PasswordPolicyMessages,
  { required = true, minimumLength = PASSWORD_MIN_LENGTH }: NewPasswordSchemaOptions = {}
): StringSchema<string> {
  let schema = string().defined(messages.required)

  if (required) {
    schema = schema.required(messages.required)
  }

  return schema
    .test('password-minimum-length', messages.minimumLength, (password) => {
      return password.length === 0 || password.length >= minimumLength
    })
    .max(PASSWORD_MAX_LENGTH, messages.maximumLength)
    .matches(PASSWORD_PATTERNS.uppercase, { message: messages.uppercase, excludeEmptyString: true })
    .matches(PASSWORD_PATTERNS.lowercase, { message: messages.lowercase, excludeEmptyString: true })
    .matches(PASSWORD_PATTERNS.number, { message: messages.number, excludeEmptyString: true })
    .matches(PASSWORD_PATTERNS.symbol, { message: messages.symbol, excludeEmptyString: true })
}

export function createPasswordConfirmationSchema(
  passwordField: string,
  messages: PasswordConfirmationMessages,
  { required = true }: PasswordConfirmationSchemaOptions = {}
): StringSchema<string> {
  let schema = string().defined(messages.required).max(PASSWORD_MAX_LENGTH, messages.maximumLength)

  if (required) {
    schema = schema.required(messages.required)
  }

  return schema.test('password-confirmation-match', messages.mismatch, function matchesPassword(confirmation) {
    if (confirmation.length === 0) return true

    return confirmation === this.resolve(ref(passwordField))
  })
}
