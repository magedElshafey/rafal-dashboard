import { cn } from '@/lib/utils'
import { type ComponentProps } from 'react'
type DashboardHeadingProps = ComponentProps<'h2'> & {
  title: string
}

const DashboardHeading = ({ title, ...props }: DashboardHeadingProps) => {
  return <h2 className={cn('font-semibold text-neutral-900 mb-4', props.className)}>{title}</h2>
}

export default DashboardHeading
