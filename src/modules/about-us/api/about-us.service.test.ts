import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { aboutUsService, serializeAboutUsUpdate } from '@/modules/about-us/api/about-us.service'
import type { RawAboutUs } from '@/modules/about-us/types/about-us.types'

const rawAboutUs: RawAboutUs = {
  id: 1,
  hero_title: { ar: 'من نحن', en: 'About Us' },
  hero_subtitle: { ar: 'العنوان الفرعي', en: 'Subtitle' },
  hero_image_url: null,
  story: { ar: 'قصتنا', en: 'Our story' },
  vision: { ar: 'رؤيتنا', en: 'Our vision' },
  mission: { ar: 'رسالتنا', en: 'Our mission' },
  features: [
    {
      key: 'feature-a',
      title: { ar: 'الجودة', en: 'Quality' },
      subtitle: { ar: 'وصف الجودة', en: 'Quality subtitle' },
      icon_url: null,
    },
  ],
  created_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
}

describe('aboutUsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the exact singleton endpoint and normalizes snake_case fields', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawAboutUs } })
    await expect(aboutUsService.get(signal)).resolves.toMatchObject({
      id: 1,
      heroTitle: rawAboutUs.hero_title,
      heroSubtitle: rawAboutUs.hero_subtitle,
      heroImageUrl: null,
      features: [{ key: 'feature-a', iconUrl: null }],
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/about-us',
      signal,
      suppressErrorNotification: true,
    })
  })

  it('rejects missing singleton data instead of fabricating content', async () => {
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: null } })
    await expect(aboutUsService.get()).rejects.toThrow('About Us data is unavailable')
  })

  it('always POSTs multipart with _method=PUT and never calls native PUT', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'updated', data: rawAboutUs } })
    await aboutUsService.update({ mission: { en: ' Updated mission ' } })
    const request = httpMocks.post.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/about-us',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(request.data).toBeInstanceOf(FormData)
    expect([...request.data.entries()]).toEqual([
      ['_method', 'PUT'],
      ['mission[en]', 'Updated mission'],
    ])
    expect(httpMocks.put).not.toHaveBeenCalled()
  })

  it('does not invent a multipart representation for an empty Feature collection', () => {
    const body = serializeAboutUsUpdate({ features: [] })

    expect([...body.entries()]).toEqual([['_method', 'PUT']])
  })

  it('serializes exact ordered Feature keys, omits a new key, and uploads only new Files', () => {
    const hero = new File(['hero'], 'hero.png', { type: 'image/png' })
    const icon = new File(['icon'], 'icon.png', { type: 'image/png' })
    const body = serializeAboutUsUpdate({
      hero,
      features: [
        {
          key: 'feature-a',
          title: { ar: ' الأولى ', en: ' First ' },
          subtitle: { ar: ' وصف ', en: ' Subtitle ' },
        },
        {
          title: { ar: ' الثانية ', en: ' Second ' },
          subtitle: { ar: ' وصف ثان ', en: ' Second subtitle ' },
          icon,
        },
      ],
    })
    const entries = [...body.entries()]
    expect(entries).toEqual([
      ['_method', 'PUT'],
      ['hero', hero],
      ['features[0][key]', 'feature-a'],
      ['features[0][title][ar]', 'الأولى'],
      ['features[0][title][en]', 'First'],
      ['features[0][subtitle][ar]', 'وصف'],
      ['features[0][subtitle][en]', 'Subtitle'],
      ['features[1][title][ar]', 'الثانية'],
      ['features[1][title][en]', 'Second'],
      ['features[1][subtitle][ar]', 'وصف ثان'],
      ['features[1][subtitle][en]', 'Second subtitle'],
      ['features[1][icon]', icon],
    ])
    expect(
      entries.some(([key, value]) => key.includes('url') || (typeof value === 'string' && value.includes('http')))
    ).toBe(false)
  })
})
