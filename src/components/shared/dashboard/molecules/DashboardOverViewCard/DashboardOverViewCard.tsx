import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { cn } from '@/lib/utils'
import {
  DashboardSectionHeader,
  DashboardSectionHeaderProps,
} from '@/components/shared/dashboard/molecules/DashboardSectionHeader'
type DashboardOverViewCardProps = DashboardSectionHeaderProps
export const DashboardOverViewCard = ({
  title,
  description,
  action,
  actionClassName,
  className,
  children,
}: DashboardOverViewCardProps) => {
  return (
    <DashboardCard>
      <DashboardSectionHeader
        className={cn('pb-6 border-b border-b-border-subtle', className)}
        description={description}
        title={title}
        action={action && { ...action }}
        actionClassName={cn(
          'inline-block bg-gradient-to-r from-brand-500 to-[#7097DD] bg-clip-text text-transparent transition-all duration-300 hover:from-[#7097DD] hover:to-brand-500',
          actionClassName
        )}
      />
      {children}
    </DashboardCard>
  )
}
