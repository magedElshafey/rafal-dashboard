import { describe, expect, it } from 'vitest'

import type { StaticPage, StaticPageFormValues } from '@/modules/static-pages/types/static-page.types'
import {
  buildStaticPageUpdatePayload,
  getLocalizedStaticPageTitle,
  normalizeStaticPageSlug,
  toStaticPageFormValues,
} from '@/modules/static-pages/utils/static-page.utils'

const values: StaticPageFormValues = {
  slug: ' Legacy / Changed ',
  title: { ar: 'عربي', en: 'English' },
  content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
  isPublished: false,
}

const page: StaticPage = {
  id: 4,
  slug: 'legacy Slug',
  title: { ar: 'عنوان', en: null },
  content: { ar: 'محتوى', en: null },
  isPublished: true,
  isSystem: false,
  createdAt: '2026-09-28T13:31:50+00:00',
  updatedAt: '2026-09-28T13:31:50+00:00',
}

describe('Static Page utilities', () => {
  it.each([
    ['  Privacy Policy  ', 'privacy-policy'],
    ['Privacy___Policy', 'privacy-policy'],
    ['privacy---policy', 'privacy-policy'],
    ['Privacy / Policy?', 'privacy-policy'],
    ['سياسة الخصوصية', 'سياسة-الخصوصية'],
    [' -- Privacy__ / ---Policy-- ', 'privacy-policy'],
    ['///nested///path///', 'nested-path'],
    ['?! / _ --', ''],
  ])('normalizes %j deterministically to one path segment', (input, expected) => {
    expect(normalizeStaticPageSlug(input)).toBe(expected)
    expect(normalizeStaticPageSlug(input)).toBe(expected)
    expect(normalizeStaticPageSlug(input)).not.toContain('/')
  })

  it('builds a full update while preserving an untouched authoritative legacy slug', () => {
    expect(
      buildStaticPageUpdatePayload({
        values,
        originalPage: page,
        slugWasEdited: false,
      })
    ).toEqual({
      slug: 'legacy Slug',
      title: { ar: 'عربي', en: 'English' },
      content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
      isPublished: false,
    })
  })

  it('normalizes an intentionally edited slug while still including every writable field', () => {
    expect(
      buildStaticPageUpdatePayload({
        values: { ...values, slug: ' New / Page? ' },
        originalPage: page,
        slugWasEdited: true,
      })
    ).toEqual({
      slug: 'new-page',
      title: { ar: 'عربي', en: 'English' },
      content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
      isPublished: false,
    })
  })

  it('initializes missing locales safely and uses display fallback without mutating data', () => {
    expect(toStaticPageFormValues(page)).toMatchObject({
      slug: 'legacy Slug',
      title: { ar: 'عنوان', en: '' },
      content: { ar: 'محتوى', en: '' },
    })
    expect(getLocalizedStaticPageTitle(page, 'en', 'Page #4')).toBe('عنوان')
    expect(page.title.en).toBeNull()
  })
})
