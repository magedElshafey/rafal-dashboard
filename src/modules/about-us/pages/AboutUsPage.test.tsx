import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { aboutUsService } from '@/modules/about-us/api/about-us.service'
import type { AboutUs, AboutUsLocalizedText, AboutUsUpdatePayload } from '@/modules/about-us/types/about-us.types'
import AboutUsPage from '@/modules/about-us/pages/AboutUsPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const initialAboutUs: AboutUs = {
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

const arabicOnlyAboutUs: AboutUs = {
  id: 1,
  heroTitle: { ar: 'تعديل', en: null },
  heroSubtitle: { ar: 'تعديل النص', en: null },
  heroImageUrl: null,
  story: { ar: 'تعديل القصة', en: null },
  vision: { ar: 'تعديل الرؤية', en: null },
  mission: { ar: 'الهدف', en: null },
  features: [
    {
      key: 'e55bac8d-5ad6-4f05-80a9-6132b4d4b3bd',
      title: { ar: 'فيشتر ar', en: null },
      subtitle: { ar: 'فيتشر en', en: null },
      iconUrl: null,
    },
  ],
  createdAt: '2026-09-26T19:47:28+00:00',
  updatedAt: '2026-09-28T11:24:34+00:00',
}

let aboutUs: AboutUs

function mergeLocalized(current: AboutUsLocalizedText, next?: AboutUsUpdatePayload['heroTitle']): AboutUsLocalizedText {
  return {
    ar: next?.ar !== undefined ? next.ar : current.ar,
    en: next?.en !== undefined ? next.en : current.en,
  }
}

function applyUpdate(payload: AboutUsUpdatePayload): AboutUs {
  const updated: AboutUs = {
    ...aboutUs,
    heroTitle: mergeLocalized(aboutUs.heroTitle, payload.heroTitle),
    heroSubtitle: mergeLocalized(aboutUs.heroSubtitle, payload.heroSubtitle),
    story: mergeLocalized(aboutUs.story, payload.story),
    vision: mergeLocalized(aboutUs.vision, payload.vision),
    mission: mergeLocalized(aboutUs.mission, payload.mission),
    heroImageUrl: payload.hero ? 'https://cdn.example.com/new-hero.png' : aboutUs.heroImageUrl,
    features: payload.features
      ? payload.features.map((feature, index) => ({
          key: feature.key ?? `generated-${index}`,
          title: { ...feature.title },
          subtitle: { ...feature.subtitle },
          iconUrl: feature.icon
            ? `https://cdn.example.com/new-icon-${index}.png`
            : (aboutUs.features.find((current) => current.key === feature.key)?.iconUrl ?? null),
        }))
      : aboutUs.features,
    updatedAt: '2026-09-29T00:00:00Z',
  }
  aboutUs = updated
  return updated
}

function installServiceFixtures() {
  vi.spyOn(aboutUsService, 'get').mockImplementation(async () => structuredClone(aboutUs))
  vi.spyOn(aboutUsService, 'update').mockImplementation(async (payload) => applyUpdate(payload))
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AboutUsPage />
    </QueryClientProvider>
  )
}

describe('AboutUsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    aboutUs = structuredClone(initialAboutUs)
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders a form-shaped skeleton, hydrates the singleton, and starts pristine', async () => {
    renderPage()
    expect(screen.getByTestId('about-us-form-skeleton')).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'Hero Title — English' })).toHaveValue('About Us')
    expect(screen.getByRole('textbox', { name: 'Mission — English' })).toHaveValue('Our mission')
    expect(screen.getAllByRole('textbox', { name: 'Feature Title — English' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getAllByText(/permanent removal is unavailable/i).length).toBeGreaterThan(0)
  })

  it('renders and updates an Arabic-only response without fabricating missing English values', async () => {
    aboutUs = structuredClone(arabicOnlyAboutUs)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const update = vi.mocked(aboutUsService.update)
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole('textbox', { name: 'Hero Title — Arabic' })).toHaveValue('تعديل')
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Hero Title — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Hero Subtitle — Arabic' })).toHaveValue('تعديل النص')
    expect(screen.getByRole('textbox', { name: 'Hero Subtitle — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Story — Arabic' })).toHaveValue('تعديل القصة')
    expect(screen.getByRole('textbox', { name: 'Story — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Vision — Arabic' })).toHaveValue('تعديل الرؤية')
    expect(screen.getByRole('textbox', { name: 'Vision — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Mission — Arabic' })).toHaveValue('الهدف')
    expect(screen.getByRole('textbox', { name: 'Mission — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Feature Title — Arabic' })).toHaveValue('فيشتر ar')
    expect(screen.getByRole('textbox', { name: 'Feature Title — English' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Feature Subtitle — Arabic' })).toHaveValue('فيتشر en')
    expect(screen.getByRole('textbox', { name: 'Feature Subtitle — English' })).toHaveValue('')

    await user.type(screen.getByRole('textbox', { name: 'Hero Title — English' }), 'About Us')
    await user.type(screen.getByRole('textbox', { name: 'Hero Subtitle — English' }), 'Subtitle')
    await user.type(screen.getByRole('textbox', { name: 'Story — English' }), 'Our story')
    await user.type(screen.getByRole('textbox', { name: 'Vision — English' }), 'Our vision')
    await user.type(screen.getByRole('textbox', { name: 'Mission — English' }), 'Our mission')
    await user.type(screen.getByRole('textbox', { name: 'Feature Title — English' }), 'Feature')
    await user.type(screen.getByRole('textbox', { name: 'Feature Subtitle — English' }), 'Feature subtitle')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update).toHaveBeenCalledWith({
      heroTitle: { en: 'About Us' },
      heroSubtitle: { en: 'Subtitle' },
      story: { en: 'Our story' },
      vision: { en: 'Our vision' },
      mission: { en: 'Our mission' },
      features: [
        {
          key: 'e55bac8d-5ad6-4f05-80a9-6132b4d4b3bd',
          title: { ar: 'فيشتر ar', en: 'Feature' },
          subtitle: { ar: 'فيتشر en', en: 'Feature subtitle' },
        },
      ],
    })
    expect(JSON.stringify(update.mock.calls[0][0])).not.toContain('undefined')
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/uncontrolled|controlled input/i)
  })

  it('shows a safe retryable load error instead of an empty fabricated form', async () => {
    const get = vi.mocked(aboutUsService.get)
    const implementation = get.getMockImplementation()
    get.mockRejectedValueOnce(new Error('unsafe backend detail')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe backend detail')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Hero Title — English' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('textbox', { name: 'Hero Title — English' })).toHaveValue('About Us')
  })

  it('preserves edits and safe feedback when Update fails', async () => {
    vi.spyOn(aboutUsService, 'update').mockRejectedValueOnce(new Error('database secret'))
    const user = userEvent.setup()
    renderPage()
    const mission = await screen.findByRole('textbox', { name: 'Mission — English' })
    await user.clear(mission)
    await user.type(mission, 'Preserved mission')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('About Us could not be updated. Your changes have been preserved.')
    )
    expect(mission).toHaveValue('Preserved mission')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
    expect(screen.queryByText('database secret')).not.toBeInTheDocument()
  })

  it('submits one localized change once and resets against the authoritative response', async () => {
    let finishUpdate: (value: AboutUs) => void = () => undefined
    const update = vi.spyOn(aboutUsService, 'update').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishUpdate = resolve
        })
    )
    const user = userEvent.setup()
    renderPage()
    const mission = await screen.findByRole('textbox', { name: 'Mission — English' })
    await user.clear(mission)
    await user.type(mission, 'Updated mission')
    await user.dblClick(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ mission: { en: 'Updated mission' } }))
    expect(update).toHaveBeenCalledTimes(1)
    finishUpdate(applyUpdate({ mission: { en: 'Updated mission' } }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled())
    expect(mission).toHaveValue('Updated mission')
    expect(toastMocks.success).toHaveBeenCalledWith('About Us updated successfully.')
  })

  it('reorders and removes Features as a complete dirty collection', async () => {
    const update = vi.spyOn(aboutUsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('textbox', { name: 'Hero Title — English' })
    expect(screen.getByRole('button', { name: 'Remove feature 1' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Remove feature 2' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Move feature 2 up' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0][0].features?.map((feature) => feature.key)).toEqual(['feature-b', 'feature-a'])

    await user.click(screen.getByRole('button', { name: 'Remove feature 1' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    expect(update.mock.calls[1][0].features?.map((feature) => feature.key)).toEqual(['feature-a'])
    expect(screen.getByRole('button', { name: 'Remove feature 1' })).toBeDisabled()
  })

  it('keeps the final Feature visible and disables its removal with an explanation', async () => {
    aboutUs = { ...aboutUs, features: [aboutUs.features[0]] }
    renderPage()

    expect(await screen.findByRole('textbox', { name: 'Feature Title — English' })).toHaveValue('First')
    const remove = screen.getByRole('button', { name: 'Remove feature 1' })
    const explanation = screen.getByText(/final Feature cannot be removed/i)
    expect(remove).toBeDisabled()
    expect(remove).toHaveAttribute('aria-describedby', explanation.id)
    expect(screen.getAllByRole('textbox', { name: 'Feature Title — English' })).toHaveLength(1)
  })

  it('renders an empty Feature collection safely and allows adding the first Feature', async () => {
    aboutUs = { ...aboutUs, features: [] }
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('textbox', { name: 'Hero Title — English' })
    expect(screen.getByText('No features are currently configured.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Feature Title — English' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Feature' }))
    expect(screen.getByRole('textbox', { name: 'Feature Title — English' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Remove feature 1' })).toBeDisabled()
    expect(screen.getByText(/final Feature cannot be removed/i)).toBeInTheDocument()
  })

  it('adds a new Feature without a backend key and marks the valid collection dirty', async () => {
    const update = vi.spyOn(aboutUsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('textbox', { name: 'Hero Title — English' })
    await user.click(screen.getByRole('button', { name: 'Add Feature' }))
    const titleAr = screen.getAllByRole('textbox', { name: 'Feature Title — Arabic' }).at(-1)!
    const titleEn = screen.getAllByRole('textbox', { name: 'Feature Title — English' }).at(-1)!
    const subtitleAr = screen.getAllByRole('textbox', { name: 'Feature Subtitle — Arabic' }).at(-1)!
    const subtitleEn = screen.getAllByRole('textbox', { name: 'Feature Subtitle — English' }).at(-1)!
    await user.type(titleAr, 'جديدة')
    await user.type(titleEn, 'New')
    await user.type(subtitleAr, 'وصف')
    await user.type(subtitleEn, 'Subtitle')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0][0].features?.at(-1)).toEqual({
      title: { ar: 'جديدة', en: 'New' },
      subtitle: { ar: 'وصف', en: 'Subtitle' },
    })
  })
})
