import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterAll(() => vi.unstubAllGlobals())

function renderTooltip(className?: string) {
  render(
    <Tooltip defaultOpen>
      <TooltipTrigger>Trigger</TooltipTrigger>
      <TooltipContent className={className}>Tooltip content</TooltipContent>
    </Tooltip>
  )

  return screen.getByText('Tooltip content')
}

describe('TooltipContent', () => {
  it('uses the global black tooltip tokens and matching arrow', () => {
    const content = renderTooltip()
    const arrow = content.querySelector('svg')

    expect(content).toHaveClass('bg-black-50', 'text-black-600')
    expect(arrow).toHaveClass('bg-black-50', 'fill-black-50')
  })

  it('preserves explicit content color overrides', () => {
    const content = renderTooltip('bg-error-50 text-error-600')

    expect(content).toHaveClass('bg-error-50', 'text-error-600')
    expect(content).not.toHaveClass('bg-black-50', 'text-black-600')
  })
})
