import { describe, expect, it, vi } from 'vitest'

import { LoginSchema } from './login/schema/login.schema'
import { ForgotPasswordSchema } from './forgot-password/schema/forget-password.schema'
import { ResetPasswordSchema } from './reset-password/schema/reset-password.schema'

vi.mock('react-i18next', () => ({
  getI18n: () => ({ t: (key: string) => key }),
}))

describe('authentication password schemas', () => {
  it('keeps login passwords required-only so legacy passwords remain accepted', async () => {
    const loginValues = {
      countryCode: '+20',
      phone: '1000000000',
      password: 'x',
      rememberMe: true,
    }

    await expect(LoginSchema.validate(loginValues)).resolves.toMatchObject({ password: 'x' })
    await expect(LoginSchema.validate({ ...loginValues, password: '' })).rejects.toMatchObject({ path: 'password' })
  })

  it.each(['+20', '+966', '+971'])(
    'keeps generic auth phone validity independent of country code %s',
    async (countryCode) => {
      const values = { countryCode, phone: '1012345678' }

      await expect(ForgotPasswordSchema.validate(values)).resolves.toMatchObject(values)
      await expect(LoginSchema.validate({ ...values, password: 'x', rememberMe: true })).resolves.toMatchObject(values)
    }
  )

  it.each(['abc', '123', '+201012345678'])('rejects invalid generic auth phone input %s', async (phone) => {
    await expect(ForgotPasswordSchema.validate({ countryCode: '+20', phone })).rejects.toMatchObject({ path: 'phone' })
  })

  it('applies the shared new-password policy and matching confirmation to reset password', async () => {
    const valid = {
      password: 'Password1!',
      passwordConfirmation: 'Password1!',
    }

    await expect(ResetPasswordSchema.validate(valid)).resolves.toEqual(valid)
    await expect(
      ResetPasswordSchema.validate({ password: 'Password1 ', passwordConfirmation: 'Password1 ' })
    ).rejects.toMatchObject({ path: 'password', message: 'validations.password_special_character' })
    await expect(
      ResetPasswordSchema.validateAt('password', {
        password: 'Password1!Password123',
        passwordConfirmation: 'Password1!Password123',
      })
    ).rejects.toMatchObject({ path: 'password', message: 'validations.password_maximum_length' })
    await expect(ResetPasswordSchema.validate({ ...valid, passwordConfirmation: 'Different1!' })).rejects.toMatchObject(
      {
        path: 'passwordConfirmation',
        message: 'auth.reset_password.passwords_not_match',
      }
    )
  })
})
