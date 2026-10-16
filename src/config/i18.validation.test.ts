import * as Yup from 'yup'
import { afterEach, describe, expect, it } from 'vitest'

import i18n from './i18'

describe('localized Yup defaults', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('uses the active language when validating an existing schema', async () => {
    await i18n.changeLanguage('en')
    const schema = Yup.object({ email: Yup.string().required().email() })

    await expect(schema.validate({ email: '' })).rejects.toMatchObject({ message: 'This field is required.' })

    await i18n.changeLanguage('ar')

    await expect(schema.validate({ email: '' })).rejects.toMatchObject({ message: 'هذا الحقل مطلوب.' })
    await expect(schema.validate({ email: 'invalid' })).rejects.toMatchObject({
      message: 'يرجى إدخال بريد إلكتروني صحيح.',
    })
  })
})
