import { afterEach, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import '@/config/i18'
import axiosInstance from '@/config/axios'
import { ordersService } from '../api/orders.service'
import show from './order-detail.fixture.json'
// Use a real Axios instance without the application auth-store initialization cycle.
vi.mock('@/config/axios', async () => {
  const { default: axios } = await import('axios')
  return { default: axios.create() }
})
const originalAdapter = axiosInstance.defaults.adapter
afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter
})
it('sends PATCH application/json through the real shared HTTP boundary, never multipart', async () => {
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
    data: { ...show, data: { ...show.data, status: 'processing' } },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }))
  axiosInstance.defaults.adapter = adapter
  await ordersService.updateStatus(21, 'processing')
  const config = adapter.mock.calls[0][0]
  expect(config.method).toBe('patch')
  expect(config.url).toBe('/dashboard/orders/21/status')
  expect(config.headers.get('Content-Type')).toBe('application/json')
  expect(config.data).toBe('{"status":"processing"}')
  expect(config.data).not.toBeInstanceOf(FormData)
})
