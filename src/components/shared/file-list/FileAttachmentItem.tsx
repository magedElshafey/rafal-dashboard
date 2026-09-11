import { memo } from 'react'
import { FileText } from 'lucide-react'

import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'

import { cn } from '@/lib/utils'
import { formatBytes } from '@/utils/file-helpers'
import { downloadFileWithFallback } from '@/utils/files/download-file'

type FileAttachmentItemProps = {
  file: Media
  ariaLabel?: string
  classNames?: {
    root?: string
    iconContainer?: string
    icon?: string
    title?: string
    size?: string
  }
}

export const FileAttachmentItem = memo(function FileAttachmentItem({
  file,
  ariaLabel,
  classNames,
}: FileAttachmentItemProps) {
  return (
    <button
      type="button"
      onClick={() =>
        void downloadFileWithFallback({
          url: file.url,
          filename: file.file_name || file.name,
          fallbackFilename: file.file_name || file.name || 'download',
        })
      }
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        classNames?.root
      )}
    >
      <DashboardIcon
        icon={FileText}
        className={cn('size-9 rounded-lg bg-black-50 text-black-600', classNames?.iconContainer)}
        iconClassName={cn('size-4', classNames?.icon)}
      />

      <span className="min-w-0">
        <span className={cn('block truncate text-sm font-medium text-neutral-800', classNames?.title)}>
          {file.file_name || file.name}
        </span>
        <span className={cn('block truncate text-xs text-neutral-600', classNames?.size)}>
          {formatBytes(file.size)}
        </span>
      </span>
    </button>
  )
})
