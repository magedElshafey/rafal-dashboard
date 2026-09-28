import { describe, expect, it } from 'vitest'

import type { AboutUs, AboutUsFormValues } from '@/modules/about-us/types/about-us.types'
import {
  buildAboutUsUpdatePayload,
  createEmptyAboutUsFeature,
  toAboutUsFormValues,
} from '@/modules/about-us/utils/about-us.utils'

const aboutUs: AboutUs = {
  id: 1,
  heroTitle: { ar: 'من نحن', en: 'About Us' },
  heroSubtitle: { ar: 'العنوان الفرعي', en: 'Subtitle' },
  heroImageUrl: 'https://cdn.example.com/hero.png',
  story: { ar: 'قصتنا', en: 'Our story' },
  vision: { ar: 'رؤيتنا', en: 'Our vision' },
  mission: { ar: 'رسالتنا', en: 'Our mission' },
  features: [
    {
      key: 'feature-a',
      title: { ar: 'الأولى', en: 'First' },
      subtitle: { ar: 'وصف أول', en: 'First subtitle' },
      iconUrl: 'https://cdn.example.com/a.png',
    },
    {
      key: 'feature-b',
      title: { ar: 'الثانية', en: 'Second' },
      subtitle: { ar: 'وصف ثان', en: 'Second subtitle' },
      iconUrl: null,
    },
  ],
  createdAt: '2026-09-28T00:00:00Z',
  updatedAt: '2026-09-28T00:00:00Z',
}

function formValues(): AboutUsFormValues {
  return toAboutUsFormValues(aboutUs)
}

describe('About Us utilities', () => {
  it('keeps remote media as URLs and never creates fake Files', () => {
    const values = formValues()
    expect(values.heroImageUrl).toBe(aboutUs.heroImageUrl)
    expect(values.hero.files).toEqual([])
    expect(values.features[0].iconUrl).toBe(aboutUs.features[0].iconUrl)
    expect(values.features[0].icon.files).toEqual([])
  })

  it('maps only one dirty localized value and omits every unchanged top-level section', () => {
    const values = formValues()
    values.mission.en = ' Updated mission '
    expect(buildAboutUsUpdatePayload(values, { mission: { en: true } })).toEqual({
      mission: { en: 'Updated mission' },
    })
  })

  it('uploads a hero only when a new local File was selected', () => {
    const values = formValues()
    expect(buildAboutUsUpdatePayload(values, { hero: { files: [] } })).toEqual({})
    const hero = new File(['hero'], 'hero.png', { type: 'image/png' })
    values.hero.files = [hero]
    expect(buildAboutUsUpdatePayload(values, { hero: { files: [true] } })).toEqual({ hero })
  })

  it('omits unchanged Features entirely', () => {
    expect(buildAboutUsUpdatePayload(formValues(), { story: { ar: true } })).not.toHaveProperty('features')
  })

  it('serializes the complete ordered collection when one Feature changes or order changes', () => {
    const values = formValues()
    values.features[0].title.en = 'Updated first'
    expect(buildAboutUsUpdatePayload(values, { features: [{ title: { en: true } }] }).features).toEqual([
      {
        key: 'feature-a',
        title: { ar: 'الأولى', en: 'Updated first' },
        subtitle: { ar: 'وصف أول', en: 'First subtitle' },
      },
      {
        key: 'feature-b',
        title: { ar: 'الثانية', en: 'Second' },
        subtitle: { ar: 'وصف ثان', en: 'Second subtitle' },
      },
    ])

    values.features.reverse()
    expect(buildAboutUsUpdatePayload(values, { features: [{}, {}] }).features?.map((feature) => feature.key)).toEqual([
      'feature-b',
      'feature-a',
    ])
  })

  it('removes absent Features and keeps existing backend keys', () => {
    const values = formValues()
    values.features.splice(0, 1)
    expect(buildAboutUsUpdatePayload(values, { features: [{}] }).features).toEqual([
      {
        key: 'feature-b',
        title: { ar: 'الثانية', en: 'Second' },
        subtitle: { ar: 'وصف ثان', en: 'Second subtitle' },
      },
    ])
  })

  it('omits a key for a new Feature and sends only its new local icon', () => {
    const values = formValues()
    const feature = createEmptyAboutUsFeature()
    const icon = new File(['icon'], 'icon.png', { type: 'image/png' })
    feature.title = { ar: 'جديدة', en: 'New' }
    feature.subtitle = { ar: 'وصف', en: 'Subtitle' }
    feature.icon.files = [icon]
    values.features.push(feature)
    const created = buildAboutUsUpdatePayload(values, { features: [{}, {}, {}] }).features?.at(-1)
    expect(created).toEqual({
      title: { ar: 'جديدة', en: 'New' },
      subtitle: { ar: 'وصف', en: 'Subtitle' },
      icon,
    })
    expect(created).not.toHaveProperty('key')
  })
})
