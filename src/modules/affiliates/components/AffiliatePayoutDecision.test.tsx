import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { affiliatePayoutsService } from '../api/affiliate-review.service'
import { AffiliatePayoutDecision } from './AffiliatePayoutDecision'
import { payoutToday } from '../schemas/affiliate-payout.schema'
const gates = vi.hoisted(() => ({ decision: true }))
vi.mock('../config/affiliate-feature', () => ({
  isAffiliateFeatureEnabled: true,
  isAffiliatePayoutFeatureEnabled: true,
  get isAffiliatePayoutDecisionReady() {
    return gates.decision
  },
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
function mount(status = 'pending') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AffiliatePayoutDecision id={7} status={status} refreshing={false} />
    </QueryClientProvider>
  )
  return client
}
beforeEach(async () => {
  gates.decision = true
  await i18n.changeLanguage('en')
})
afterEach(() => vi.restoreAllMocks())
describe('Closed payout decision preparation (synthetic capability)', () => {
  it.each(['paid', 'rejected'])('hides actions for %s', (status) => {
    mount(status)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('does not expose actions while the decision gate is closed', () => {
    gates.decision = false
    mount()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('defaults today, validates reference, preserves 422 draft and allows a corrected submission', async () => {
    const paid = vi.spyOn(affiliatePayoutsService, 'paid').mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { errors: { transfer_reference: ['Reference already used'] } } },
    })
    mount()
    await userEvent.click(screen.getByRole('button', { name: 'Mark paid' }))
    const dialog = screen.getByRole('alertdialog')
    expect(screen.getByLabelText(/Transfer date/)).toHaveValue(payoutToday())
    await userEvent.type(screen.getByLabelText(/Transfer reference/), 'AB')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mark paid' }))
    expect(await screen.findByText(/3–50/)).toBeInTheDocument()
    expect(paid).not.toHaveBeenCalled()
    await userEvent.type(screen.getByLabelText(/Transfer reference/), 'C')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mark paid' }))
    expect(await screen.findByText('Reference already used')).toBeInTheDocument()
    expect(screen.getByLabelText(/Transfer reference/)).toHaveValue('ABC')
    expect(paid).toHaveBeenCalledWith(7, { transfer_reference: 'ABC', transferred_at: payoutToday() })
  })
  it('locks duplicate rejection, reconciles 409 and never replays', async () => {
    let reject!: (error: unknown) => void
    const decision = vi.spyOn(affiliatePayoutsService, 'reject').mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail
        })
    )
    const client = mount()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Reject payout' }))
    await userEvent.type(screen.getByLabelText(/Reason/), 'A valid reason for rejection')
    const submit = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reject payout' })
    await userEvent.dblClick(submit)
    expect(decision).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()
    reject({ isAxiosError: true, response: { status: 409 } })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['affiliates', 'payouts'] })
    expect(decision).toHaveBeenCalledTimes(1)
  })
  it('retains the draft and blocks resubmission after an ambiguous network failure', async () => {
    const decision = vi.spyOn(affiliatePayoutsService, 'reject').mockRejectedValue(new Error('network'))
    mount()
    await userEvent.click(screen.getByRole('button', { name: 'Reject payout' }))
    await userEvent.type(screen.getByLabelText(/Reason/), 'A valid reason for rejection')
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reject payout' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('result is uncertain')
    expect(screen.getByLabelText(/Reason/)).toHaveValue('A valid reason for rejection')
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reject payout' })).toBeDisabled()
    expect(decision).toHaveBeenCalledTimes(1)
  })
  it('renders an accessible Arabic RTL dialog and cancel sends nothing', async () => {
    await i18n.changeLanguage('ar')
    const paid = vi.spyOn(affiliatePayoutsService, 'paid')
    mount()
    await userEvent.click(screen.getByRole('button', { name: i18n.t('affiliates.payouts.paid') }))
    expect(screen.getByRole('alertdialog')).toHaveAttribute('dir', 'rtl')
    await userEvent.click(screen.getByRole('button', { name: i18n.t('affiliates.actions.cancel') }))
    expect(paid).not.toHaveBeenCalled()
  })
})
