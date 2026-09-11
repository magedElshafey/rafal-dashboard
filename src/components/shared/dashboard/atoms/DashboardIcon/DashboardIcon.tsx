import { ComponentProps, ComponentType, isValidElement, ReactElement, SVGProps } from 'react'
import { cn } from '@/lib/utils'
export type SvgIconComponent = ComponentType<SVGProps<SVGSVGElement>>
type DashboardIconProps = ComponentProps<'div'> & {
  iconClassName?: string
  icon?: SvgIconComponent | ReactElement
}

export const DashboardIcon = ({ iconClassName, icon: Icon, ...props }: DashboardIconProps) => {
  const iconElement = isValidElement(Icon) ? Icon : Icon ? <Icon className={cn('size-5', iconClassName)} /> : null

  return (
    <div className={cn('flex size-15 shrink-0 items-center justify-center rounded-md', props.className)} aria-hidden>
      {iconElement}
    </div>
  )
}
