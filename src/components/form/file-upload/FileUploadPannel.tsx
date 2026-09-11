import { forwardRef, memo } from 'react'
import { Upload } from 'lucide-react'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardCardHeader } from '@/components/shared/dashboard/molecules/DashboardCardHeader'
import { cn } from '@/lib/utils'

import { FileUploadBox, type FileUploadBoxProps } from './FileUploadBox'
import { ExistingUploadedFiles } from './ExistingUploadedFiles'

export type FileUploadPanelProps = FileUploadBoxProps & {
  title?: string
  description?: string
  error?: string
  showIcon?: boolean

  existingFiles?: Media[]
  existingFilesLabel?: string
  openExistingFileLabel?: string
  existingFilesEmptyMessage?: string
  existingFileFallbackName?: string
}

export const FileUploadPanel = memo(
  forwardRef<HTMLInputElement, FileUploadPanelProps>(function FileUploadPanel(
    {
      files,
      onFilesChange,
      title,
      description,
      error,
      showIcon = true,
      existingFiles = [],
      existingFilesLabel,
      openExistingFileLabel,
      existingFilesEmptyMessage,
      existingFileFallbackName,
      disabled = false,
      variant = 'dropzone',
      ...fileUploadBoxProps
    },
    forwardedRef
  ) {
    const describedByIds = fileUploadBoxProps['aria-describedby']?.split(/\s+/).filter(Boolean) ?? []
    const descriptionId = describedByIds[0]
    const errorId = error ? describedByIds.at(-1) : undefined

    return (
      <DashboardCard
        radius="lg"
        padding={variant === 'compact' ? 'lg' : undefined}
        className={cn(!showIcon && variant !== 'compact' && 'border-none')}
      >
        {(title || description || showIcon) && (
          <DashboardCardHeader
            icon={showIcon ? Upload : undefined}
            iconContainerClassName="size-9 rounded-full bg-black-50 text-black-600"
            iconClassName="size-4"
            title={title}
            description={description}
            titleClassName={variant === 'compact' ? 'text-base leading-6' : undefined}
          />
        )}

        <div
          className={cn(
            title || description || showIcon ? (variant === 'compact' ? 'mt-3' : 'mt-6') : undefined,
            'space-y-4'
          )}
        >
          <ExistingUploadedFiles
            files={existingFiles}
            label={existingFilesLabel}
            openFileLabel={openExistingFileLabel}
            emptyMessage={existingFilesEmptyMessage}
            fallbackFileName={existingFileFallbackName}
            disabled={disabled}
          />

          <FileUploadBox
            {...fileUploadBoxProps}
            ref={forwardedRef}
            helperTextId={descriptionId}
            files={files}
            disabled={disabled}
            variant={variant}
            onFilesChange={onFilesChange}
          />
        </div>

        {error && (
          <p id={errorId} className="mt-2 text-xs text-error-600" role="alert">
            {error}
          </p>
        )}
      </DashboardCard>
    )
  })
)
