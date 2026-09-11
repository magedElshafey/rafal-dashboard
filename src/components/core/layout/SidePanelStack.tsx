import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const SIDE_PANEL_GAP_CLASS_NAME = {
  sm: 'space-y-4',
  md: 'space-y-5',
  lg: 'space-y-6',
} as const

type SidePanelGap = keyof typeof SIDE_PANEL_GAP_CLASS_NAME

type SidePanelStackProps = {
  children: ReactNode
  className?: string
  gap?: SidePanelGap
}

export function SidePanelStack({ children, className, gap = 'md' }: SidePanelStackProps) {
  return <aside className={cn(SIDE_PANEL_GAP_CLASS_NAME[gap], className)}>{children}</aside>
}
