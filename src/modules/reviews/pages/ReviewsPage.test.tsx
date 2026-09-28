import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { reviewsService } from '@/modules/reviews/api/reviews.service'
import ReviewsPage from '@/modules/reviews/pages/ReviewsPage'
import type { ReviewListItem, ReviewResponse, ReviewStatus } from '@/modules/reviews/types/review.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const review = (
  id: number,
  status: ReviewStatus = 'pending',
  overrides: Partial<ReviewListItem> = {}
): ReviewListItem => ({
  id,
  rating: id === 1 ? 4.5 : 5,
  comment: `Complete review comment ${id}`,
  status,
  adminResponse: null,
  helpfulCount: id,
  reportsCount: 0,
  reviewer: {
    id,
    firstName: status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected',
    lastName: 'Reviewer',
    email: `reviewer${id}@example.com`,
  },
  product: { id: 20 + id, name: `Product ${id}`, slug: `product-${id}` },
  createdAt: '2026-09-23T17:53:47+00:00',
  updatedAt: '2026-09-23T17:55:59+00:00',
  ...overrides,
})

function paginated(
  items: ReviewListItem[],
  page = 1,
  totalPages = 1,
  total = items.length
): PaginatedData<ReviewListItem> {
  return {
    items,
    paginate: {
      current_page: page,
      total_pages: totalPages,
      per_page: 15,
      total,
      count: items.length,
      next_page_url: page < totalPages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}

function moderationResponse(item: ReviewListItem, status: 'approved' | 'rejected'): ReviewResponse {
  return { success: true, message: 'moderated', data: { ...item, status } }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ReviewsPage />
    </QueryClientProvider>
  )
}

async function openModeration(
  user: ReturnType<typeof userEvent.setup>,
  reviewerName: string,
  productName: string,
  reviewId: number,
  action: string
) {
  await user.click(
    (
      await screen.findAllByRole('button', {
        name: `Moderation actions for ${reviewerName} — ${productName} — Review #${reviewId}`,
      })
    )[0]
  )
  await user.click(
    await screen.findByRole('menuitem', {
      name: `${action} review by ${reviewerName} for ${productName}, review #${reviewId}`,
    })
  )
}

describe('ReviewsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('shows a layout skeleton and then the localized empty state', async () => {
    let resolveList!: (value: PaginatedData<ReviewListItem>) => void
    vi.spyOn(reviewsService, 'list').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve
        })
    )
    renderPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    resolveList(paginated([]))
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument()
  })

  it('shows a safe initial error with retry and never exposes raw details', async () => {
    vi.spyOn(reviewsService, 'list')
      .mockRejectedValueOnce(new Error('unsafe database detail'))
      .mockResolvedValueOnce(paginated([]))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument()
  })

  it('renders responsive provisional rows and exposes moderation only for pending reviews', async () => {
    vi.spyOn(reviewsService, 'list').mockResolvedValue(
      paginated([review(1, 'pending'), review(2, 'approved'), review(3, 'rejected')])
    )
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findAllByText('Pending Reviewer')).toHaveLength(2)
    expect(screen.getAllByText('4.5 / 5')).toHaveLength(2)
    expect(screen.getAllByText('Complete review comment 1')).toHaveLength(2)
    expect(screen.getAllByText('Product 1')).toHaveLength(2)
    expect(
      screen.getAllByRole('button', { name: 'Moderation actions for Pending Reviewer — Product 1 — Review #1' })
    ).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Moderation actions for Approved Reviewer/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Moderation actions for Rejected Reviewer/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.click(
      screen.getAllByRole('button', {
        name: 'Moderation actions for Pending Reviewer — Product 1 — Review #1',
      })[0]
    )
    expect(
      await screen.findByRole('menuitem', {
        name: 'Approve review by Pending Reviewer for Product 1, review #1',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Reject review by Pending Reviewer for Product 1, review #1' })
    ).toBeInTheDocument()
  })

  it('reveals and collapses exact full comments by keyboard for every moderation status', async () => {
    const pendingComment = 'Pending '.repeat(30).trim()
    const approvedComment = 'Approved '.repeat(30).trim()
    const rejectedComment = 'Rejected '.repeat(30).trim()
    vi.spyOn(reviewsService, 'list').mockResolvedValue(
      paginated([
        review(1, 'pending', { comment: pendingComment }),
        review(2, 'approved', { comment: approvedComment }),
        review(3, 'rejected', { comment: rejectedComment }),
      ])
    )
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findAllByRole('button', { name: 'Show full comment for review #1' })).toHaveLength(2)
    const approvedToggle = screen.getAllByRole('button', { name: 'Show full comment for review #2' })[0]
    const approvedText = screen.getAllByText(approvedComment)[0]
    expect(approvedToggle).toHaveAttribute('aria-expanded', 'false')
    expect(approvedText).toHaveAttribute('dir', 'auto')
    expect(approvedText).toHaveClass('line-clamp-2')

    approvedToggle.focus()
    expect(approvedToggle).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(approvedToggle).toHaveAttribute('aria-expanded', 'true')
    expect(approvedText).not.toHaveClass('line-clamp-2')
    expect(approvedText).toHaveTextContent(approvedComment)

    await user.keyboard('{Enter}')
    expect(approvedToggle).toHaveAttribute('aria-expanded', 'false')
    expect(approvedText).toHaveClass('line-clamp-2')

    const rejectedToggle = screen.getAllByRole('button', { name: 'Show full comment for review #3' })[0]
    await user.click(rejectedToggle)
    expect(rejectedToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText(rejectedComment)[0]).not.toHaveClass('line-clamp-2')
  })

  it('disambiguates same-reviewer actions and confirmations by product and Review ID', async () => {
    const sameReviewer = {
      id: 7,
      firstName: 'Same',
      lastName: 'Reviewer',
      email: 'same@example.com',
    }
    const first = review(10, 'pending', {
      reviewer: sameReviewer,
      product: { id: 20, name: 'Product Alpha', slug: 'product-alpha' },
    })
    const second = review(11, 'pending', {
      reviewer: sameReviewer,
      product: { id: 21, name: 'Product Beta', slug: 'product-beta' },
    })
    vi.spyOn(reviewsService, 'list').mockResolvedValue(paginated([first, second]))
    const moderate = vi
      .spyOn(reviewsService, 'moderate')
      .mockImplementation(async (id, status) => moderationResponse(id === first.id ? first : second, status))
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findAllByRole('button', {
        name: 'Moderation actions for Same Reviewer — Product Alpha — Review #10',
      })
    ).toHaveLength(2)
    expect(
      screen.getAllByRole('button', {
        name: 'Moderation actions for Same Reviewer — Product Beta — Review #11',
      })
    ).toHaveLength(2)

    await openModeration(user, 'Same Reviewer', 'Product Alpha', 10, 'Approve')
    let dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Approve the review by Same Reviewer for Product Alpha (Review #10)?')
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(moderate).toHaveBeenCalledWith(10, 'approved')

    await openModeration(user, 'Same Reviewer', 'Product Beta', 11, 'Reject')
    dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Reject the review by Same Reviewer for Product Beta (Review #11)?')
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(moderate).toHaveBeenCalledWith(11, 'rejected')
  })

  it('preserves the first page and retries only a failed next page', async () => {
    let pageTwoAttempts = 0
    vi.spyOn(reviewsService, 'list').mockImplementation(async (page) => {
      if (page === 1) return paginated([review(1)], 1, 2, 2)
      pageTwoAttempts += 1
      if (pageTwoAttempts === 1) throw new Error('unsafe next page detail')
      return paginated([review(2, 'approved')], 2, 2, 2)
    })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findAllByText('Pending Reviewer')).toHaveLength(2)
    const notices = await screen.findAllByTestId('query-state-refetch-error')
    expect(screen.getAllByText('Pending Reviewer')).toHaveLength(2)
    expect(screen.queryByText('unsafe next page detail')).not.toBeInTheDocument()
    await user.click(within(notices.at(-1)!).getByRole('button', { name: /try again/i }))
    expect(await screen.findAllByText('Approved Reviewer')).toHaveLength(2)
    expect(pageTwoAttempts).toBe(2)
  })

  it('requires confirmation and prevents duplicate Approve submissions', async () => {
    const item = review(1)
    vi.spyOn(reviewsService, 'list').mockResolvedValue(paginated([item]))
    let resolveModeration!: (value: ReviewResponse) => void
    const moderate = vi.spyOn(reviewsService, 'moderate').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveModeration = resolve
        })
    )
    const user = userEvent.setup()
    renderPage()
    await openModeration(user, 'Pending Reviewer', 'Product 1', 1, 'Approve')

    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Approve' })
    expect(moderate).not.toHaveBeenCalled()
    await user.dblClick(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(moderate).toHaveBeenCalledTimes(1)
    expect(moderate).toHaveBeenCalledWith(1, 'approved')
    resolveModeration(moderationResponse(item, 'approved'))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('requires Reject confirmation and preserves loaded rows/dialog on failure', async () => {
    vi.spyOn(reviewsService, 'list').mockResolvedValue(paginated([review(1)]))
    vi.spyOn(reviewsService, 'moderate').mockRejectedValue(new Error('unsafe moderation detail'))
    const user = userEvent.setup()
    renderPage()
    await openModeration(user, 'Pending Reviewer', 'Product 1', 1, 'Reject')
    const dialog = await screen.findByRole('alertdialog')
    expect(reviewsService.moderate).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Review could not be rejected.'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('Complete review comment 1')).toHaveLength(2)
    expect(screen.queryByText('unsafe moderation detail')).not.toBeInTheDocument()
  })
})
