import { describe, expect, it } from 'vitest'

import { createAffiliateSchema } from '@/modules/affiliates/schemas/affiliate.schema'

const schema = createAffiliateSchema({
  required: 'required',
  emailInvalid: 'invalid-email',
  mobileInvalid: 'invalid-mobile',
  codeInvalid: 'invalid-code',
  nameTooLong: 'name-long',
  emailTooLong: 'email-long',
  platformTooLong: 'platform-long',
  usernameTooLong: 'username-long',
})

const valid = {
  name: 'Sara Al Salem',
  mobile: '0551234567',
  email: 'sara@example.test',
  platform: 'instagram',
  username: 'sara.style',
  code: 'SARA42',
}

describe('Affiliate creation schema', () => {
  it('accepts the supported Saudi mobile forms', async () => {
    for (const mobile of ['0551234567', '551234567', '966551234567', '00966551234567', '+966551234567']) {
      await expect(schema.validate({ ...valid, mobile })).resolves.toMatchObject({ mobile })
    }
  })

  it.each(['123', '055123456', '+201001234567'])('rejects invalid Saudi mobile %s', async (mobile) => {
    await expect(schema.validate({ ...valid, mobile })).rejects.toThrow('invalid-mobile')
  })

  it.each(['ABC', 'lowercase', 'CODE-1', 'CODE WITH SPACE', 'ABCDEFGHIJKLMNOPQRST1'])(
    'rejects invalid code %s',
    async (code) => {
      await expect(schema.validate({ ...valid, code })).rejects.toThrow('invalid-code')
    }
  )

  it('rejects missing fields and an invalid email', async () => {
    await expect(schema.validate({ ...valid, name: '' })).rejects.toThrow('required')
    await expect(schema.validate({ ...valid, email: 'invalid' })).rejects.toThrow('invalid-email')
  })
})
