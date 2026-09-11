import { getTodayFormattedDate } from '@/utils/date/date.helpers'
import { CalendarDays } from 'lucide-react'

const TodayDateLabel = () => {
  const today = getTodayFormattedDate()
  return (
    <div className="bg-neutral-0 py-2 px-3 border border-neutral-200 rounded-lg flex items-center justify-center gap-1 text-neutral-800 text-sm min-w-36 h-12">
      <CalendarDays size={15} />
      <span>{today}</span>
    </div>
  )
}

export default TodayDateLabel
