import { memo } from 'react'
import { ExternalLink, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'

import { formatBytes } from './file-upload.utils'

type ExistingUploadedFilesProps = {
  files: Media[]
  label?: string
  openFileLabel?: string
  emptyMessage?: string
  fallbackFileName?: string
  disabled?: boolean
}

export const ExistingUploadedFiles = memo(function ExistingUploadedFiles({
  files,
  label,
  openFileLabel = 'Open file',
  emptyMessage,
  fallbackFileName = 'File',
  disabled = false,
}: ExistingUploadedFilesProps) {
  if (files.length === 0)
    return emptyMessage ? (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium text-content-primary">{label}</p>}
        <p className="text-sm text-content-secondary">{emptyMessage}</p>
      </div>
    ) : null

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-content-primary">{label}</p>}

      <ul className="space-y-2">
        {files.map((file) => {
          const fileName = file.name?.trim() || file.file_name?.trim() || fallbackFileName

          return (
            <li
              key={String(file.id)}
              className={cn(
                'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3',
                'rounded-xl border border-border-subtle bg-surface-page px-3 py-2',
                disabled && 'opacity-60'
              )}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 md:size-9">
                <FileText className="size-4" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p title={fileName} className="truncate text-xs font-medium text-content-primary md:text-sm">
                  {fileName}
                </p>

                <p className="mt-0.5 text-xs text-content-secondary">{formatBytes(file.size)}</p>
              </div>

              <a
                href={disabled ? undefined : file.url}
                target="_blank"
                rel="noreferrer"
                aria-disabled={disabled}
                aria-label={`${openFileLabel}: ${fileName}`}
                tabIndex={disabled ? -1 : undefined}
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  'text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  disabled && 'pointer-events-none'
                )}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
})
