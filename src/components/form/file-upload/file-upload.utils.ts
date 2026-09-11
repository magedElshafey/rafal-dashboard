export function getLocalFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

export { formatBytes } from '@/utils/file-helpers'
