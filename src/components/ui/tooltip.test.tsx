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
  it('uses the semantic tooltip colors and matching arrow', () => {
    const content = renderTooltip()
    const arrow = content.querySelector('svg')

    expect(content).toHaveClass('bg-foreground', 'text-background')
    expect(arrow).toHaveClass('bg-foreground', 'fill-foreground')
  })

  it('preserves explicit content color overrides', () => {
    const content = renderTooltip('bg-destructive/10 text-destructive')

    expect(content).toHaveClass('bg-destructive/10', 'text-destructive')
    expect(content).not.toHaveClass('bg-foreground', 'text-background')
  })
})
