import { describe, expect, it } from 'vitest'

import { createStaticPageSchema } from '@/modules/static-pages/schemas/static-page.schema'

const schema = createStaticPageSchema({ slugRequired: 'Slug required' })

describe('Static Page schema', () => {
  it('rejects a slug whose normalized output is empty', async () => {
    await expect(
      schema.validate({
        slug: '?! / --',
        title: { ar: '', en: '' },
        content: { ar: '', en: '' },
        isPublished: false,
        isSystem: false,
      })
    ).rejects.toThrow('Slug required')
  })

  it('does not invent localized-field requiredness', async () => {
    await expect(
      schema.validate({
        slug: 'صفحة',
        title: { ar: '', en: '' },
        content: { ar: '', en: '' },
        isPublished: false,
        isSystem: false,
      })
    ).resolves.toMatchObject({ slug: 'صفحة' })
  })
})
