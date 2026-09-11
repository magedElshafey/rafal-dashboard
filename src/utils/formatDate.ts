import { parseISO, format } from 'date-fns'

export const formatDate = (unFormattedDate: string) => {
  return format(parseISO(unFormattedDate), 'MM/dd/yyyy')
}

export function currentDateInApiFormat() {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, '0') // Day
  const month = String(date.getMonth() + 1).padStart(2, '0') // Month (0-indexed)
  const year = date.getFullYear() // Year
  let hours = date.getHours() // Hours
  const minutes = String(date.getMinutes()).padStart(2, '0') // Minutes

  // Determine AM/PM and convert 24-hour time to 12-hour format
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12 // Convert hour to 12-hour format

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
}
