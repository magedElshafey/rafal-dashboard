import { object } from 'yup'
import { describe, expect, it } from 'vitest'

import ar from '@/lang/ar.json'
import en from '@/lang/en.json'

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE_KEYS,
  createNewPasswordSchema,
  createPasswordConfirmationSchema,
  type PasswordPolicyMessages,
} from './password-policy'

const messages = {
  required: 'required',
  minimumLength: 'minimumLength',
  maximumLength: 'maximumLength',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  number: 'number',
  symbol: 'symbol',
} satisfies PasswordPolicyMessages

const newPasswordSchema = createNewPasswordSchema(messages)

describe('shared password policy', () => {
  it('accepts passwords at the approved minimum and maximum boundaries', async () => {
    await expect(newPasswordSchema.validate('Abcdef1!')).resolves.toBe('Abcdef1!')
    await expect(newPasswordSchema.validate('Password1!Password12')).resolves.toBe('Password1!Password12')

    expect(PASSWORD_MIN_LENGTH).toBe(8)
    expect(PASSWORD_MAX_LENGTH).toBe(20)
  })

  it.each([
    ['an empty value', '', 'required'],
    ['fewer than eight characters', 'Abcd1!x', 'minimumLength'],
    ['no uppercase English letter', 'password1!', 'uppercase'],
    ['no lowercase English letter', 'PASSWORD1!', 'lowercase'],
    ['no number', 'Password!', 'number'],
    ['no symbol', 'Password1', 'symbol'],
    ['whitespace in place of a symbol', 'Password1 ', 'symbol'],
    ['more than 20 characters', 'Password1!Password123', 'maximumLength'],
  ])('rejects %s', async (_case, password, message) => {
    await expect(newPasswordSchema.validate(password)).rejects.toMatchObject({ message })
  })

  it('accepts non-alphanumeric, non-whitespace symbols including underscore', async () => {
    await expect(newPasswordSchema.validate('Password1_')).resolves.toBe('Password1_')
  })

  it('supports optional replacement-password fields without weakening supplied values', async () => {
    const optionalSchema = createNewPasswordSchema(messages, { required: false })

    await expect(optionalSchema.validate('')).resolves.toBe('')
    await expect(optionalSchema.validate('Password1!')).resolves.toBe('Password1!')
    await expect(optionalSchema.validate('weakpass')).rejects.toMatchObject({ message: 'uppercase' })
  })

  it('provides a reusable matching confirmation contract', async () => {
    const schema = object({
      password: newPasswordSchema,
      confirmation: createPasswordConfirmationSchema('password', {
        required: 'confirmationRequired',
        mismatch: 'confirmationMismatch',
        maximumLength: 'maximumLength',
      }),
    })

    await expect(schema.validate({ password: 'Password1!', confirmation: 'Password1!' })).resolves.toBeDefined()
    await expect(schema.validate({ password: 'Password1!', confirmation: '' })).rejects.toMatchObject({
      path: 'confirmation',
      message: 'confirmationRequired',
    })
    await expect(schema.validate({ password: 'Password1!', confirmation: 'Different1!' })).rejects.toMatchObject({
      path: 'confirmation',
      message: 'confirmationMismatch',
    })
  })

  it('keeps every shared policy message available in English and Arabic', () => {
    const validationKeys = Object.values(PASSWORD_POLICY_MESSAGE_KEYS).map((key) => key.replace('validations.', ''))

    for (const key of validationKeys) {
      expect(en.validations[key as keyof typeof en.validations]).toBeTruthy()
      expect(ar.validations[key as keyof typeof ar.validations]).toBeTruthy()
    }

    expect(en.validations.password_minimum_length).toContain('{{min}}')
    expect(ar.validations.password_minimum_length).toContain('{{min}}')
    expect(en.validations.password_maximum_length).toContain('{{max}}')
    expect(ar.validations.password_maximum_length).toContain('{{max}}')
  })
})
