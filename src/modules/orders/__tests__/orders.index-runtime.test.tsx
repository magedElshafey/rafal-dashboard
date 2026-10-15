import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import OrdersPage from '../pages/OrdersPage'
import { customerLabel } from '../utils/order-presentation'
import { installDomMocks, renderOrders } from './test-utils'
import fixture from './orders-index-runtime.fixture.json'
import statuses from './statuses.fixture.json'

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
afterEach(async () => {
  vi.unstubAllGlobals()
  await i18n.changeLanguage('en')
})

it.each(['en', 'ar'])('renders null email with phone or localized fallback in %s', async (language) => {
  installDomMocks()
  await i18n.changeLanguage(language)
  http.get.mockImplementation(async ({ url }: { url: string }) => ({
    data: url.endsWith('/statuses') ? statuses : fixture,
  }))
  renderOrders(<OrdersPage />)
  expect(await screen.findAllByText('#RF-10038')).toHaveLength(2)
  expect(screen.getAllByText('+966512332112').length).toBeGreaterThan(0)
  expect(customerLabel(fixture.data[0].customer, i18n.t('orders.unavailable'))).toBe('+966512332112')
  expect(customerLabel({ ...fixture.data[0].customer, phone: '' }, i18n.t('orders.unavailable'))).toBe(
    i18n.t('orders.unavailable')
  )
})
