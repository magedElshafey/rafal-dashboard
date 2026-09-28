import { describe, expect, it } from 'vitest'

import { createAboutUsSchema } from '@/modules/about-us/schemas/about-us.schema'
import type { AboutUsFormValues } from '@/modules/about-us/types/about-us.types'
import { createEmptyImageUploadValue } from '@/modules/about-us/utils/about-us.utils'

const schema = createAboutUsSchema({ required: 'required' })
const valid: AboutUsFormValues = {
  heroTitle: { ar: 'عنوان', en: 'Title' },
  heroSubtitle: { ar: 'فرعي', en: 'Subtitle' },
  heroImageUrl: null,
  hero: createEmptyImageUploadValue(),
  story: { ar: 'قصة', en: 'Story' },
  vision: { ar: 'رؤية', en: 'Vision' },
  mission: { ar: 'رسالة', en: 'Mission' },
  features: [
    {
      key: 'feature-a',
      title: { ar: 'ميزة', en: 'Feature' },
      subtitle: { ar: 'وصف', en: 'Subtitle' },
      iconUrl: null,
      icon: createEmptyImageUploadValue(),
    },
  ],
}

describe('About Us validation', () => {
  it.each([
    ['heroTitle', 'ar'],
    ['heroTitle', 'en'],
    ['heroSubtitle', 'ar'],
    ['heroSubtitle', 'en'],
    ['story', 'ar'],
    ['story', 'en'],
    ['vision', 'ar'],
    ['vision', 'en'],
    ['mission', 'ar'],
    ['mission', 'en'],
  ] as const)('requires %s.%s', async (section, language) => {
    const values = structuredClone(valid)
    values[section][language] = '   '
    await expect(schema.isValid(values)).resolves.toBe(false)
  })

  it.each([
    ['title', 'ar'],
    ['title', 'en'],
    ['subtitle', 'ar'],
    ['subtitle', 'en'],
  ] as const)('requires every Feature %s.%s', async (field, language) => {
    const values = structuredClone(valid)
    values.features[0][field][language] = ''
    await expect(schema.isValid(values)).resolves.toBe(false)
  })

  it('allows optional hero and Feature media to remain empty', async () => {
    await expect(schema.isValid(valid)).resolves.toBe(true)
  })
})
