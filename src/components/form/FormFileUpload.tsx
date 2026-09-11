import { cn } from '@/lib/utils'
import { useState, useRef, type ChangeEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { useFormWrapperContext } from '../core/FormWrapper'
import { FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { CloudUpload, File, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/utils/file-helpers'

type fileTypes =
  | 'image/*'
  | 'video/*'
  | 'audio/*'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface FilesPreviewProps {
  selectedFiles: (File | IFileResponse)[] | File | IFileResponse
  removeImage: (index: number, url?: string) => void
}

interface FormFileUploadProps {
  renderPreview?: (props: FilesPreviewProps) => ReactNode
  label?: string
  name: string
  maxSize?: number // in MB
  maxLength?: number
  accept?: fileTypes | string
  multiple?: boolean
  wrapperClassName?: string
  labelClassName?: string
  dropzoneClassName?: string
  iconClassName?: string
  titleClassName?: string
  hintClassName?: string
  title?: string
  browseLabel?: string
  helperText?: string
}

export function FormFileUpload({
  label,
  name,
  multiple,
  maxSize = 10,
  maxLength,
  accept = 'image/*',
  wrapperClassName,
  labelClassName,
  dropzoneClassName,
  iconClassName,
  titleClassName,
  hintClassName,
  title,
  browseLabel,
  helperText,
  renderPreview,
}: FormFileUploadProps) {
  const { t } = useTranslation()
  const { errors } = useFormWrapperContext()
  const { control, setValue, getValues, watch, clearErrors } = useFormContext()

  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedFiles = watch(name) || []

  const handleFileSelect = (files: FileList) => {
    // Validate max file number
    if (multiple && !validateMaxLength(Array.from(files)))
      return toast.error(t('validations.too_many_files', { maxLength }))

    Array.from(files).forEach((file) => {
      if (!file) return

      // Validate file size
      if (!validateMaxSize(file)) return toast.error(t('validations.file_too_large', { maxSize }))

      setValue(name, multiple ? [...(getValues(name) || []), file] : file, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      clearErrors(name)
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (files) {
      handleFileSelect(files)
    }
  }

  const removeImage = (index: number, url?: string) => {
    if (url) URL.revokeObjectURL(url)

    if (fileInputRef.current) fileInputRef.current.value = ''

    // Incase input not accepting multiple files
    if (!multiple) {
      setValue(name, null, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      return
    }

    // Incase input accepting multiple files
    const filteredValues = Array.from(selectedFiles).filter((_, i) => i !== index)
    setValue(name, filteredValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const validateMaxLength = (files: File[]): boolean => {
    const currentFiles = getValues(name) || []
    const selectedFilesLength = Array.isArray(currentFiles) ? currentFiles.length : currentFiles ? 1 : 0
    if (maxLength && Array.from(files).length + selectedFilesLength > maxLength) return false

    return true
  }

  const validateMaxSize = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) return false

    return true
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files) {
      handleFileSelect(files)
    }
  }

  function getAllowedFileTypesDescription(): string {
    const mimeToExtensions: Record<string, string[]> = {
      'image/*': ['*.jpeg', '*.jpg', '*.png', '*.gif', '*.webp'],
      'video/*': ['*.mp4', '*.mov', '*.avi'],
      'audio/*': ['*.mp3', '*.wav', '*.ogg'],
      'application/pdf': ['*.pdf'],
      'application/msword': ['*.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['*.docx'],
      'application/vnd.ms-excel': ['*.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['*.xlsx'],
    }

    return mimeToExtensions[accept]?.join(', ') ?? accept
  }

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (selectedImage?.length) {
  //       selectedImage.forEach((f) => f.url && URL.revokeObjectURL(f.url))
  //     }
  //   }
  // }, [])

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <div className={cn('w-full flex flex-col justify-between gap-2', wrapperClassName)}>
          <label htmlFor={`image-upload-${name}`} className="flex flex-col gap-2 w-full">
            <FormItem>
              {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  'flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-black-50 bg-black-50 p-7 shadow-xs transition-colors hover:border-brand-500',
                  isDragging && 'border-brand-500 ring-3 ring-brand-500/20',
                  errors[name] && 'border-error-500 bg-error-50 ring-3 ring-error-500/20 hover:border-error-500',
                  dropzoneClassName
                )}
              >
                <CloudUpload size={24} className={iconClassName} />
                <p className={cn('font-medium text-sm', titleClassName)}>
                  {title ?? t('label.file_upload_placeholder_title')}{' '}
                  {browseLabel && <span className="font-semibold text-brand-500">{browseLabel}</span>}
                </p>
                <p className={cn('text-sm', hintClassName)}>
                  {helperText ?? t('label.file_upload_file_types', { accept: getAllowedFileTypesDescription() })}
                </p>
                {!helperText && (
                  <p className="text-sm text-center">
                    {`${t('label.file_upload_max_file_size', { maxSize })} ${maxLength && maxSize && t('label.and')} ${maxLength && t('label.file_upload_max_file_number', { maxLength })}`}
                  </p>
                )}
                <input
                  multiple={multiple}
                  ref={fileInputRef}
                  id={`image-upload-${name}`}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <FormMessage />
            </FormItem>
          </label>
          {renderPreview ? (
            renderPreview({ selectedFiles, removeImage })
          ) : (
            <FilesPreview selectedFiles={selectedFiles} removeImage={removeImage} />
          )}
        </div>
      )}
    />
  )
}

const FilesPreview = ({ selectedFiles, removeImage }: FilesPreviewProps) => {
  if (!selectedFiles) return <></>

  const filesAsArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {filesAsArray.map((file, index) => {
        const isExistingFile = 'path' in file
        const fileUrl = isExistingFile ? file.path : URL.createObjectURL(file)

        return (
          <div
            key={isExistingFile ? `${file.id}-${file.name}` : file.name}
            className="flex gap-2 justify-between items-center p-2 transition-shadow shadow-xs hover:shadow-md bg-transparent dark:bg-input/30 rounded-md"
          >
            <div className="flex gap-2 items-center">
              <div className="w-[60px] h-[60px] grid place-items-center relative overflow-hidden rounded-md">
                {file.type.startsWith('image/') ? (
                  <img alt={file.name} src={fileUrl} className="object-cover object-center w-full h-full" />
                ) : (
                  <File size={24} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium truncate max-w-[150px]">{file.name}</p>
                <p className="text-xs font-medium truncate max-w-[150px]">{file.type.split('/')[1]}</p>
                <p className="text-sm text-muted-foreground">
                  {isExistingFile ? 'Existing file' : formatBytes(file.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => removeImage(index, isExistingFile ? undefined : fileUrl)}
            >
              <Trash2 size={24} />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
