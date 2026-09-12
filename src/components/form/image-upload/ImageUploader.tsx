import { ImageIcon, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/utils/file-helpers'

import { dimensionsAreValid, getImageFileId, matchesImageAccept, readImageDimensions } from './image-upload.utils'
import type { ExistingImage, ImageDimensions, ImageId, ImagePreviewFit } from './image-upload.types'

type ReplacementTarget = { kind: 'local'; index: number } | { kind: 'existing'; id: ImageId }

export type ImageUploaderProps = {
  mode: 'single' | 'multiple'
  files: File[]
  onFilesChange: (files: File[]) => void
  existingImages?: readonly ExistingImage[]
  removedExistingIds?: readonly ImageId[]
  onExistingRemove?: (image: ExistingImage) => void
  accept?: string
  maxFiles?: number
  maxFileSize?: number
  dimensions?: ImageDimensions
  previewFit?: ImagePreviewFit
  disabled?: boolean
  required?: boolean
  error?: string
  className?: string
  label?: string
  ariaLabel?: string
}

export function ImageUploader({
  mode,
  files,
  onFilesChange,
  existingImages = [],
  removedExistingIds = [],
  onExistingRemove,
  accept = 'image/*',
  maxFiles,
  maxFileSize,
  dimensions,
  previewFit = 'contain',
  disabled = false,
  required = false,
  error,
  className,
  label,
  ariaLabel,
}: ImageUploaderProps) {
  const { t } = useTranslation()
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replacementTargetRef = useRef<ReplacementTarget | null>(null)
  const previewUrlsRef = useRef(new Map<File, string>())
  const [previewUrls, setPreviewUrls] = useState(new Map<File, string>())
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const resolvedMaxFiles = mode === 'single' ? 1 : maxFiles
  const visibleExisting = useMemo(
    () => existingImages.filter((image) => !removedExistingIds.includes(image.id)),
    [existingImages, removedExistingIds]
  )
  const displayedExisting = mode === 'single' && files.length > 0 ? [] : visibleExisting
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  useEffect(() => {
    const current = previewUrlsRef.current
    const next = new Map<File, string>()
    files.forEach((file) => next.set(file, current.get(file) ?? URL.createObjectURL(file)))
    current.forEach((url, file) => {
      if (!next.has(file)) URL.revokeObjectURL(url)
    })
    previewUrlsRef.current = next
    setPreviewUrls(next)
  }, [files])

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      previewUrlsRef.current.clear()
    },
    []
  )

  const validateFile = useCallback(
    async (file: File) => {
      if (!matchesImageAccept(file, accept)) return t('imageUploader.errors.invalidType', { file: file.name })
      if (maxFileSize !== undefined && file.size > maxFileSize)
        return t('imageUploader.errors.maxSize', { file: file.name, size: formatBytes(maxFileSize) })
      if (dimensions) {
        try {
          const actual = await readImageDimensions(file)
          if (!dimensionsAreValid(actual, dimensions)) return t('imageUploader.errors.dimensions', { file: file.name })
        } catch {
          return t('imageUploader.errors.preview', { file: file.name })
        }
      }
      return null
    },
    [accept, dimensions, maxFileSize, t]
  )

  const acceptFiles = useCallback(
    async (selected: File[], replacement: ReplacementTarget | null = null) => {
      if (disabled || selected.length === 0) return
      setIsProcessing(true)
      setLocalError(null)
      try {
        const candidate = mode === 'single' ? selected.slice(0, 1) : selected
        const replacedLocalIndex = replacement?.kind === 'local' ? replacement.index : -1
        const existingKeys = new Set(files.filter((_, index) => index !== replacedLocalIndex).map(getImageFileId))
        const unique = candidate.filter((file) => {
          const key = getImageFileId(file)
          if (existingKeys.has(key)) return false
          existingKeys.add(key)
          return true
        })
        if (unique.length !== candidate.length) {
          setLocalError(t('imageUploader.errors.duplicate'))
          return
        }

        const countBefore = files.length + visibleExisting.length - (replacement ? 1 : 0)
        if (resolvedMaxFiles !== undefined && mode === 'multiple' && countBefore + unique.length > resolvedMaxFiles) {
          setLocalError(t('imageUploader.errors.maxFiles', { count: resolvedMaxFiles }))
          return
        }

        for (const file of unique) {
          const validationError = await validateFile(file)
          if (validationError) {
            setLocalError(validationError)
            return
          }
        }

        if (replacement?.kind === 'local') {
          onFilesChange(files.map((file, index) => (index === replacement.index ? unique[0] : file)))
        } else if (replacement?.kind === 'existing') {
          const existing = visibleExisting.find((image) => image.id === replacement.id)
          if (existing) onExistingRemove?.(existing)
          onFilesChange(mode === 'single' ? unique.slice(0, 1) : [...files, ...unique])
        } else {
          onFilesChange(mode === 'single' ? unique.slice(0, 1) : [...files, ...unique])
        }
      } finally {
        setIsProcessing(false)
        if (inputRef.current) inputRef.current.value = ''
        if (replaceInputRef.current) replaceInputRef.current.value = ''
      }
    },
    [disabled, files, mode, onExistingRemove, onFilesChange, resolvedMaxFiles, t, validateFile, visibleExisting]
  )

  const openReplacement = (target: ReplacementTarget) => {
    replacementTargetRef.current = target
    replaceInputRef.current?.click()
  }

  const totalCount = files.length + displayedExisting.length
  const resolvedError = error ?? localError

  return (
    <section className={cn('min-w-0 space-y-3', className)} aria-busy={isProcessing || undefined}>
      {label ? <p className="text-sm font-medium text-content-primary">{label}</p> : null}
      <div
        role="group"
        aria-label={ariaLabel ?? label ?? t('imageUploader.label')}
        aria-describedby={`${hintId}${resolvedError ? ` ${errorId}` : ''}`}
        aria-invalid={Boolean(resolvedError)}
        className={cn(
          'rounded-2xl border border-dashed border-border bg-black-50 p-4 transition-colors sm:p-6',
          'focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/20',
          isDragging && 'border-brand-500 bg-brand-50',
          resolvedError && 'border-error-500 ring-3 ring-error-500/20',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void acceptFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={mode === 'multiple'}
          disabled={disabled || isProcessing}
          required={required && totalCount === 0}
          aria-label={t('imageUploader.browse')}
          onChange={(event) => void acceptFiles(Array.from(event.target.files ?? []))}
        />
        <input
          ref={replaceInputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled || isProcessing}
          aria-label={t('imageUploader.replaceInput')}
          onChange={(event) =>
            void acceptFiles(Array.from(event.target.files ?? []).slice(0, 1), replacementTargetRef.current)
          }
        />

        <div className="flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface text-brand-600 shadow-xs">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-medium text-content-primary">{t('imageUploader.drag')}</p>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || isProcessing}
            className="mt-1 text-brand-600"
            onClick={() => inputRef.current?.click()}
          >
            {isProcessing ? t('imageUploader.processing') : t('imageUploader.browse')}
          </Button>
          <p id={hintId} className="text-xs text-content-secondary">
            {t('imageUploader.hint', {
              maximum: resolvedMaxFiles ?? t('imageUploader.unlimited'),
              size: maxFileSize ? formatBytes(maxFileSize) : t('imageUploader.unlimited'),
            })}
          </p>
        </div>
      </div>

      <p className="text-xs text-content-secondary" aria-live="polite">
        {t('imageUploader.selectedCount', { count: totalCount })}
      </p>
      {resolvedError ? (
        <p id={errorId} role="alert" className="text-xs text-error-600">
          {resolvedError}
        </p>
      ) : null}

      {totalCount > 0 ? (
        <ul
          className={cn(
            'grid max-h-80 grid-cols-1 gap-3 overflow-y-auto overscroll-contain pe-1 sm:grid-cols-2',
            mode === 'multiple' && 'xl:grid-cols-3'
          )}
          aria-label={t('imageUploader.previewList')}
        >
          {displayedExisting.map((image) => (
            <ImagePreviewItem
              key={`remote-${image.id}`}
              src={image.url}
              name={image.alt || t('imageUploader.existingImage')}
              fit={previewFit}
              remote
              disabled={disabled || isProcessing}
              onReplace={() => openReplacement({ kind: 'existing', id: image.id })}
              onRemove={onExistingRemove ? () => onExistingRemove(image) : undefined}
            />
          ))}
          {files.map((file, index) => (
            <ImagePreviewItem
              key={getImageFileId(file)}
              src={previewUrls.get(file)}
              name={file.name}
              fit={previewFit}
              disabled={disabled || isProcessing}
              onReplace={() => openReplacement({ kind: 'local', index })}
              onRemove={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

type ImagePreviewItemProps = {
  src?: string
  name: string
  fit: ImagePreviewFit
  remote?: boolean
  disabled: boolean
  onReplace: () => void
  onRemove?: () => void
}

function ImagePreviewItem({ src, name, fit, remote = false, disabled, onReplace, onRemove }: ImagePreviewItemProps) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  return (
    <li className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video bg-black-50">
        {src && !failed ? (
          <img
            src={src}
            alt={name}
            className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-content-secondary">
            <ImageIcon className="size-7" aria-hidden="true" />
            <span className="max-w-full truncate px-3 text-xs">{name}</span>
          </div>
        )}
        {remote ? (
          <span className="absolute start-2 top-2 rounded-md bg-surface/90 px-2 py-1 text-[10px] text-content-secondary">
            {t('imageUploader.remote')}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center gap-2 p-2">
        <span title={name} className="min-w-0 flex-1 truncate text-xs text-content-primary">
          {name}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          disabled={disabled}
          aria-label={t('imageUploader.replaceNamed', { name })}
          onClick={onReplace}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
        {onRemove ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-error-500 hover:bg-error-50 hover:text-error-600"
            disabled={disabled}
            aria-label={t('imageUploader.removeNamed', { name })}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}
