import { cn } from '@/lib/utils'
import { Ellipsis } from 'lucide-react'

const EllipsisIcon = ({ className = '' }: { className?: string }) => {
  return <Ellipsis className={cn('text-neutral-600', className)} size={15} />
}

export default EllipsisIcon
