import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

function QueryHarness() {
  const location = useLocation()
  const navigate = useNavigate()
  const { forwardAddQuery, forwardDeleteQuery } = useQuery()

  return (
    <>
      <output aria-label="current search">{location.search}</output>
      <output aria-label="current pathname">{location.pathname}</output>
      <button type="button" onClick={() => forwardAddQuery({ status: 'pending' })}>
        Add pending
      </button>
      <button
        type="button"
        onClick={() => {
          forwardAddQuery({ status: 'pending' })
          forwardAddQuery({ status: 'pending' })
        }}
      >
        Add pending twice
      </button>
      <button type="button" onClick={() => forwardDeleteQuery('status', { replace: true })}>
        Remove status with replace
      </button>
      <button
        type="button"
        onClick={() => {
          forwardAddQuery({ page: '2' }, { replace: true })
          forwardDeleteQuery('status', { replace: true })
        }}
      >
        Compose route updates with replace
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
    </>
  )
}

function LocalQueryHarness() {
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery } = useQuery()

  return (
    <>
      <output aria-label="local query">{JSON.stringify(forwardQuery)}</output>
      <button
        type="button"
        onClick={() => {
          forwardAddQuery({ status: 'pending' })
          forwardDeleteQuery('view')
          forwardAddQuery({ page: '2' })
        }}
      >
        Compose local updates
      </button>
    </>
  )
}

function renderQueryHarness(initialEntries: string[], resetQueryNamesOnChange: string[] = []) {
  render(
    <MemoryRouter
      initialEntries={initialEntries}
      initialIndex={initialEntries.length - 1}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <QueryProvider resetQueryNamesOnChange={resetQueryNamesOnChange}>
        <QueryHarness />
      </QueryProvider>
    </MemoryRouter>
  )
}

describe('QueryProvider route updates', () => {
  it('composes same-tick Add and Delete calls and retains replace history semantics', async () => {
    renderQueryHarness(['/before', '/todos?status=invalid&view=grid'])

    fireEvent.click(screen.getByRole('button', { name: 'Compose route updates with replace' }))
    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid&page=2'))

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByLabelText('current pathname')).toHaveTextContent('/before'))

    fireEvent.click(screen.getByRole('button', { name: 'Forward' }))
    await waitFor(() => expect(screen.getByLabelText('current pathname')).toHaveTextContent('/todos'))
    expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid&page=2')
  })

  it('uses replace navigation while preserving unrelated query parameters', async () => {
    renderQueryHarness(['/before', '/todos?status=invalid&view=grid'])

    fireEvent.click(screen.getByRole('button', { name: 'Remove status with replace' }))
    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid'))

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    await waitFor(() => expect(screen.getByLabelText('current pathname')).toHaveTextContent('/before'))
  })

  it('does not create a redundant history entry when the URL is unchanged', async () => {
    renderQueryHarness(['/before', '/todos?status=pending'])

    fireEvent.click(screen.getByRole('button', { name: 'Add pending' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    await waitFor(() => expect(screen.getByLabelText('current pathname')).toHaveTextContent('/before'))
  })

  it('treats a same-tick duplicate of a pending route update as a no-op', async () => {
    renderQueryHarness(['/before', '/todos?view=grid'])

    fireEvent.click(screen.getByRole('button', { name: 'Add pending twice' }))
    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid&status=pending'))

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid'))
    expect(screen.getByLabelText('current pathname')).toHaveTextContent('/todos')
  })

  it('pushes meaningful updates and applies configured query resets', async () => {
    renderQueryHarness(['/todos?page=3&view=grid'], ['page'])

    fireEvent.click(screen.getByRole('button', { name: 'Add pending' }))
    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?view=grid&status=pending'))

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    await waitFor(() => expect(screen.getByLabelText('current search')).toHaveTextContent('?page=3&view=grid'))
  })
})

describe('QueryProvider local updates', () => {
  it('keeps same-tick local updates compositional', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryProvider isRouteQuery={false} initialQuery={{ view: 'grid' }}>
          <LocalQueryHarness />
        </QueryProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Compose local updates' }))

    await waitFor(() =>
      expect(screen.getByLabelText('local query')).toHaveTextContent('{"status":"pending","page":"2"}')
    )
  })
})
