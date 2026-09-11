import { forwardRef, memo, useCallback, useRef } from 'react'
import type { AriaAttributes, FocusEventHandler, ForwardedRef } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { formatBytes, getLocalFileKey } from './file-upload.utils'
import UploadIcon from '@/components/icons/UploadIcon'

export type FileUploadValidationResult = {
  validFiles: File[]
  errors: string[]
}

export type FileUploadValidator = (selectedFiles: File[], currentFiles: File[]) => FileUploadValidationResult

export type FileUploadBoxProps = {
  files: File[]
  onFilesChange: (files: File[]) => void

  accept?: string
  helperText?: string
  disabled?: boolean
  required?: boolean

  dropzoneTitle?: string
  dropzoneDescription?: string
  fileInputLabel?: string
  browseButtonLabel?: string
  selectedFilesLabel?: string
  compactEmptyMessage?: string
  removeFileLabel?: string
  dropzoneClassName?: string

  validateFiles?: FileUploadValidator
  getFileKey?: (file: File) => string
  formatFileSize?: (sizeInBytes: number) => string
  multiple?: boolean
  variant?: 'dropzone' | 'compact'

  id?: string
  helperTextId?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  'aria-describedby'?: string
  'aria-invalid'?: AriaAttributes['aria-invalid']
}

const defaultValidateFiles: FileUploadValidator = (selectedFiles) => ({
  validFiles: selectedFiles,
  errors: [],
})

function assignInputRef(ref: ForwardedRef<HTMLInputElement>, value: HTMLInputElement | null) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

export const FileUploadBox = memo(
  forwardRef<HTMLInputElement, FileUploadBoxProps>(function FileUploadBox(
    {
      files,
      onFilesChange,
      accept,
      helperText,
      disabled = false,
      required = false,
      multiple = true,
      variant = 'dropzone',
      dropzoneTitle,
      fileInputLabel,
      browseButtonLabel = 'browse files',
      selectedFilesLabel = 'Selected files',
      compactEmptyMessage,
      removeFileLabel = 'Remove',
      dropzoneClassName,
      validateFiles = defaultValidateFiles,
      getFileKey = getLocalFileKey,
      formatFileSize: formatSize = formatBytes,
      id,
      helperTextId,
      onBlur,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
    },
    forwardedRef
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const setInputRef = useCallback(
      (input: HTMLInputElement | null) => {
        inputRef.current = input
        assignInputRef(forwardedRef, input)
      },
      [forwardedRef]
    )

    const resetInputValue = useCallback(() => {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }, [])

    const handleFiles = useCallback(
      (selectedFiles: FileList | null) => {
        if (disabled || !selectedFiles || selectedFiles.length === 0) {
          return
        }

        const selectedFilesArray = Array.from(selectedFiles)

        const candidateFiles = multiple ? selectedFilesArray : selectedFilesArray.slice(0, 1)

        /*
         * Selecting another file in single-file mode
         * replaces the previous selected file.
         */
        const currentFiles = multiple ? files : []

        const { validFiles, errors } = validateFiles(candidateFiles, currentFiles)

        if (errors.length > 0) {
          toast.error(errors[0])
        }

        if (validFiles.length > 0) {
          const nextFiles = multiple ? [...files, ...validFiles] : validFiles.slice(0, 1)

          onFilesChange(nextFiles)
        }

        resetInputValue()
      },
      [disabled, files, multiple, onFilesChange, resetInputValue, validateFiles]
    )

    const handleRemoveFile = useCallback(
      (fileIndex: number) => {
        if (disabled) {
          return
        }

        onFilesChange(files.filter((_, index) => index !== fileIndex))

        resetInputValue()
      },
      [disabled, files, onFilesChange, resetInputValue]
    )

    const fileInput = (
      <input
        ref={setInputRef}
        id={id}
        type="file"
        multiple={multiple}
        disabled={disabled}
        aria-required={required}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className="sr-only"
        accept={accept}
        aria-label={fileInputLabel ?? browseButtonLabel}
        onBlur={onBlur}
        onChange={(event) => {
          handleFiles(event.target.files)
        }}
      />
    )

    const selectedFiles = files.length > 0 && (
      <ul
        className={cn('space-y-2 text-start', variant === 'dropzone' && 'mt-5')}
        aria-label={selectedFilesLabel}
        aria-live="polite"
      >
        {files.map((file, index) => (
          <li
            key={getFileKey(file)}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border-subtle bg-surface-page px-3 py-2"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-black-50 text-black-500 md:size-9">
              <FileText className="size-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p title={file.name} className="truncate text-xs font-medium text-content-primary md:text-sm">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-content-secondary">{formatSize(file.size)}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="size-9 shrink-0 rounded-lg text-error-500 hover:bg-error-50 hover:text-error-600"
              onClick={() => handleRemoveFile(index)}
              aria-label={`${removeFileLabel} ${file.name}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    )

    if (variant === 'compact') {
      return (
        <div className="space-y-3" aria-disabled={disabled}>
          {fileInput}
          {selectedFiles ||
            (compactEmptyMessage ? (
              <div className="flex min-h-13 items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 text-start">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black-50 text-black-500">
                  <FileText className="size-4" aria-hidden="true" />
                </div>
                <p className="text-sm text-content-secondary">{compactEmptyMessage}</p>
              </div>
            ) : null)}
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex min-h-16 items-center justify-between gap-4 rounded-lg border border-dashed border-black-100 bg-black-50 px-4 py-3',
              'transition-colors hover:border-black-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
              disabled &&
                'cursor-not-allowed border-black-100 bg-black-100 text-content-secondary hover:border-black-100'
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (!disabled) handleFiles(event.dataTransfer.files)
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <UploadIcon />
              <div className="min-w-0 text-start">
                {dropzoneTitle ? <p className="text-sm font-medium text-content-primary">{dropzoneTitle}</p> : null}
                {helperText ? (
                  <p id={helperTextId} className="mt-0.5 text-xs text-content-secondary">
                    {helperText}
                  </p>
                ) : null}
              </div>
            </div>
            {/* <Button
              className="shrink-0 text-sm font-medium text-brand-600"
              type="button"
              disabled={disabled}
              variant="ghost"
            ></Button> */}
          </div>
        </div>
      )
    }

    return (
      <div
        aria-disabled={disabled}
        className={cn(
          'rounded-2xl border border-dashed border-black-50 bg-black-50 p-8 text-center',
          'transition-colors hover:border-black-300 focus-within:border-black-500 focus-within:ring-2 focus-within:ring-black-200',
          disabled && 'cursor-not-allowed border-black-100 bg-black-100 text-content-secondary hover:border-black-100',
          dropzoneClassName
        )}
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={(event) => {
          event.preventDefault()

          if (!disabled) {
            handleFiles(event.dataTransfer.files)
          }
        }}
      >
        {fileInput}
        <div className="flex justify-center">
          <UploadIcon />
        </div>
        <Button
          className="text-sm font-medium text-neutral-800"
          type="button"
          disabled={disabled}
          variant="ghost"
          onClick={() => inputRef.current?.click()}
        >
          {browseButtonLabel}
        </Button>

        {helperText && (
          <p id={helperTextId} className="text-xs text-neutral-400">
            {helperText}
          </p>
        )}

        {selectedFiles}
      </div>
    )
  })
)
