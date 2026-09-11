import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'

import { QueryStateBoundary } from './QueryStateBoundary'

const baseProps = {
  loadingFallback: <div>Matching skeleton</div>,
  isLoading: false,
  isLoadingError: false,
  isRefetchError: false,
  isPaused: false,
  isFetching: false,
  hasData: false,
  onRetry: vi.fn(),
}

describe('QueryStateBoundary', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('renders a safe initial error and retries on explicit action', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <QueryStateBoundary {...baseProps} isLoadingError onRetry={onRetry}>
        <div>Loaded content</div>
      </QueryStateBoundary>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load content')
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('preserves loaded content when a background refresh fails', () => {
    render(
      <QueryStateBoundary {...baseProps} isRefetchError hasData>
        <div>Existing roles</div>
      </QueryStateBoundary>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Unable to refresh data')
    expect(screen.getByText('Existing roles')).toBeInTheDocument()
  })

  it('wraps a structural skeleton in one accessible loading status', () => {
    render(
      <QueryStateBoundary {...baseProps} isLoading>
        <div>Loaded content</div>
      </QueryStateBoundary>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading content...')
    expect(screen.getByText('Matching skeleton').closest('[aria-hidden="true"]')).toBeInTheDocument()
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
  })
})
