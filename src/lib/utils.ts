import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const debounce = (func: (...args: any[]) => void, delay: number = 500) => {
  let timer: ReturnType<typeof setTimeout>
  const debounced = (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => func(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}
