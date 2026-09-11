import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTableContext } from '@/components/ui/Table/TableContext'
import { TableProvider } from '@/components/ui/Table/TableProvider'

function TableConsumer() {
  const { data, isLoading, refetch } = useTableContext<{ id: number; name: string }>()

  return (
    <div>
      <span>{isLoading ? 'Loading' : data.map((item) => item.name).join(', ')}</span>
      <button type="button" onClick={() => void refetch()}>
        Retry
      </button>
    </div>
  )
}

describe('TableProvider', () => {
  it('exposes caller-owned query data and refetch behavior without fetching', () => {
    const refetch = vi.fn()

    render(
      <TableProvider data={[{ id: 1, name: 'Administrator' }]} refetch={refetch}>
        <TableConsumer />
      </TableProvider>
    )

    expect(screen.getByText('Administrator')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Retry' }).click()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('prefers paginated server data when supplied', () => {
    render(
      <TableProvider
        data={[{ id: 1, name: 'Fallback' }]}
        serverData={{
          items: [{ id: 2, name: 'Server role' }],
          paginate: { current_page: 1, per_page: 15, total: 1, total_pages: 1 },
        }}
      >
        <TableConsumer />
      </TableProvider>
    )

    expect(screen.getByText('Server role')).toBeInTheDocument()
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument()
  })
})
