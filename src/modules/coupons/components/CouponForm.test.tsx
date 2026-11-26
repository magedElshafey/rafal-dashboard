import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { CouponForm, EMPTY_COUPON_FORM_VALUES } from './CouponForm'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

describe('Affiliate code collisions in coupon forms', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })
  it.each(['create', 'edit'] as const)(
    'preserves the %s draft and renders the Backend code error as text',
    async (intent) => {
      const message = '<img src=x onerror=alert(1)> Code belongs to an Affiliate'
      const submit = vi
        .fn()
        .mockRejectedValue({ isAxiosError: true, response: { status: 422, data: { errors: { code: [message] } } } })
      render(
        <>
          <CouponForm
            formId="collision"
            initialValues={{
              ...EMPTY_COUPON_FORM_VALUES,
              code: 'AFF123',
              name: { en: 'Draft', ar: 'Draft' },
              value: 10,
            }}
            resetValuesKey={intent}
            isSubmitting={false}
            onFormStateChange={() => undefined}
            onSubmit={submit}
          />
          <button type="submit" form="collision" data-submit-intent={intent}>
            Submit
          </button>
        </>
      )
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue('AFF123')
      expect(document.querySelector('img')).toBeNull()
      expect(submit).toHaveBeenCalledTimes(1)
      expect(submit.mock.calls[0][1]).toBe(intent)
    }
  )
})
