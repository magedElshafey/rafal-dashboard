import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { AffiliateForm } from './AffiliateForm'
import { affiliatesService } from '../api/affiliates.service'
import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => vi.restoreAllMocks())
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={client}>
      <AffiliateForm formId="create" isSubmitting={false} onSubmit={vi.fn()} />
    </QueryClientProvider>
  )
  return { ...view, client }
}
it('does not overwrite code after a manual edit is undone while generation is pending', async () => {
  let resolve!: (result: { code: string }) => void
  vi.spyOn(affiliatesService, 'generateCode').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  mount()
  await userEvent.click(screen.getByRole('button', { name: 'Generate code' }))
  const input = screen.getByRole('textbox', { name: 'Affiliate code' })
  await userEvent.type(input, 'EDIT')
  await userEvent.clear(input)
  await act(async () => resolve({ code: 'STALE123' }))
  await screen.findByRole('button', { name: 'Generate code' })
  expect(input).toHaveValue('')
})
it('uses a generated code only when the user has not edited the field while waiting', async () => {
  let resolve!: (result: { code: string }) => void
  const generate = vi.spyOn(affiliatesService, 'generateCode').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  mount()
  await userEvent.type(screen.getByLabelText(/Full name/), 'Synthetic')
  await userEvent.click(await screen.findByRole('button', { name: 'Generate code' }))
  expect(generate).toHaveBeenCalledWith('Synthetic', expect.any(AbortSignal))
  await userEvent.type(screen.getByRole('textbox', { name: 'Affiliate code' }), 'MANUAL')
  await act(async () => resolve({ code: 'GENERATED' }))
  expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('MANUAL')
  generate.mockResolvedValue({ code: 'NEW123' })
  await userEvent.click(await screen.findByRole('button', { name: 'Generate code' }))
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('NEW123'))
})
it('retains manual input and shows a localized error when generation fails', async () => {
  vi.spyOn(affiliatesService, 'generateCode').mockRejectedValue(new Error('private response'))
  mount()
  await userEvent.type(screen.getByRole('textbox', { name: 'Affiliate code' }), 'MANUAL')
  await userEvent.click(await screen.findByRole('button', { name: 'Generate code' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be generated')
  expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('MANUAL')
  expect(screen.queryByText('private response')).not.toBeInTheDocument()
})
it('aborts the old name request and applies only the current name response', async () => {
  const completions: ((result: { code: string }) => void)[] = []
  const generate = vi.spyOn(affiliatesService, 'generateCode').mockImplementation(
    () =>
      new Promise((done) => {
        completions.push(done)
      })
  )
  mount()
  const name = screen.getByRole('textbox', { name: /Full name/ })
  await userEvent.type(name, 'First')
  await userEvent.click(screen.getByRole('button', { name: 'Generate code' }))
  const firstSignal = generate.mock.calls[0][1]!
  await userEvent.clear(name)
  await userEvent.type(name, 'Second')
  expect(firstSignal.aborted).toBe(true)
  await userEvent.click(await screen.findByRole('button', { name: 'Generate code' }))
  expect(generate).toHaveBeenLastCalledWith('Second', expect.any(AbortSignal))
  await act(async () => {
    completions[1]({ code: 'SECOND1' })
  })
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('SECOND1'))
  await act(async () => {
    completions[0]({ code: 'FIRST1' })
  })
  expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('SECOND1')
})
it('does not reuse cached suggestion data after cancellation', async () => {
  let finish!: (result: { code: string }) => void
  const generate = vi.spyOn(affiliatesService, 'generateCode').mockResolvedValueOnce({ code: 'OLD123' })
  const { client } = mount()
  await userEvent.click(screen.getByRole('button', { name: 'Generate code' }))
  const input = screen.getByRole('textbox', { name: 'Affiliate code' })
  await waitFor(() => expect(input).toHaveValue('OLD123'))
  await userEvent.clear(input)
  await userEvent.type(input, 'MANUAL')
  generate.mockImplementation(
    () =>
      new Promise((done) => {
        finish = done
      })
  )
  await userEvent.click(screen.getByRole('button', { name: 'Generate code' }))
  await act(async () => {
    await client.cancelQueries({ queryKey: ['affiliates', 'code-suggestion'] })
  })
  expect(generate.mock.calls[1][1]?.aborted).toBe(true)
  await act(async () => finish({ code: 'LATE123' }))
  expect(input).toHaveValue('MANUAL')
})
it('aborts on unmount and ignores a response crossing the authentication boundary', async () => {
  let finish!: (result: { code: string }) => void
  const generate = vi.spyOn(affiliatesService, 'generateCode').mockImplementation(
    () =>
      new Promise((done) => {
        finish = done
      })
  )
  const { unmount } = mount()
  await userEvent.click(screen.getByRole('button', { name: 'Generate code' }))
  clearQueryClientAtAuthBoundary()
  await act(async () => finish({ code: 'STALE123' }))
  expect(screen.getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('')
  await userEvent.click(await screen.findByRole('button', { name: 'Generate code' }))
  unmount()
  expect(generate.mock.calls[1][1]?.aborted).toBe(true)
  await act(async () => finish({ code: 'UNMOUNTED' }))
})
