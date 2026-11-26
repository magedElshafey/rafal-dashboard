import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { AffiliateForm } from './AffiliateForm'
import { affiliatesService } from '../api/affiliates.service'
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => vi.restoreAllMocks())
function mount() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AffiliateForm formId="create" isSubmitting={false} onSubmit={vi.fn()} />
    </QueryClientProvider>
  )
}
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
