import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataLayout,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from './ResponsiveDataLayout'

describe('ResponsiveDataLayout', () => {
  it('provides feature-agnostic semantic desktop and mobile slots at the lg breakpoint', () => {
    const { container } = render(
      <div dir="rtl">
        <ResponsiveDataLayout
          aria-labelledby="inventory-title"
          header={<h2 id="inventory-title">Inventory</h2>}
          isEmpty={false}
          empty={<p>No inventory</p>}
        >
          <ResponsiveDataDesktop>
            <ResponsiveDataTable columns={[{ id: 'item', header: 'Item' }]}>
              <ResponsiveDataTableRow>
                <ResponsiveDataTableCell>Desktop item</ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            </ResponsiveDataTable>
          </ResponsiveDataDesktop>
          <ResponsiveDataMobileCards>
            <ResponsiveDataMobileCard
              title="Mobile item"
              facts={<ResponsiveDataFact label="Code">A-1</ResponsiveDataFact>}
            />
          </ResponsiveDataMobileCards>
        </ResponsiveDataLayout>
      </div>
    )

    const desktop = container.querySelector('[data-slot="responsive-data-desktop"]')
    const mobile = container.querySelector('[data-slot="responsive-data-mobile-cards"]')

    expect(desktop).toHaveClass('hidden', 'lg:block')
    expect(mobile).toHaveClass('lg:hidden')
    expect(within(desktop as HTMLElement).getByRole('table')).toBeInTheDocument()
    expect(within(mobile as HTMLElement).getByRole('article')).toBeInTheDocument()
    expect(screen.getByText('Code').closest('[dir="rtl"]')).toBeInTheDocument()
  })

  it('renders loading and empty slots without rendering responsive data surfaces', () => {
    const { container, rerender } = render(
      <ResponsiveDataLayout header={<h2>Inventory</h2>} isLoading isEmpty={false} loading={<p>Loading</p>} empty={null}>
        <ResponsiveDataDesktop>Desktop data</ResponsiveDataDesktop>
      </ResponsiveDataLayout>
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="responsive-data-desktop"]')).toBeNull()

    rerender(
      <ResponsiveDataLayout header={<h2>Inventory</h2>} isEmpty empty={<p>Nothing here</p>}>
        <ResponsiveDataDesktop>Desktop data</ResponsiveDataDesktop>
      </ResponsiveDataLayout>
    )

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="responsive-data-desktop"]')).toBeNull()
  })
})
