import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DonutDistributionCard } from './DonutDistributionCard'

vi.mock('../molecules/DonutChart', () => ({
  DonutChart: () => <div data-testid="donut-chart" />,
}))

const data = [
  { key: 'present', label: 'Present', value: 7, color: 'green' },
  { key: 'absent', label: 'Absent', value: 20, color: 'red' },
  { key: 'late', label: 'Late', value: 7, color: 'orange' },
  { key: 'excused', label: 'Excused', value: 4, color: 'gray' },
]

describe('DonutDistributionCard', () => {
  it('renders raw legend counts without calculating category percentages when requested', () => {
    render(
      <DonutDistributionCard title="Performance Overview" data={data} legendValue="value" orientation="horizontal" />
    )

    expect(screen.getByText('Performance Overview')).toBeInTheDocument()
    for (const item of data) {
      const legend = screen.getByText(item.label).parentElement
      expect(legend).toHaveTextContent(String(item.value))
      expect(legend).not.toHaveTextContent('%')
    }
  })
})
