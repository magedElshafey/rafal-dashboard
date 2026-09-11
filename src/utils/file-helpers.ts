export type FileUploadValidationMessages = {
  invalidType: (file: File, allowedExtensionsLabel: string) => string
  invalidSize: (file: File, maxFileSizeMb: number) => string
  duplicated: (file: File) => string
}

export type FileUploadValidationConfig = {
  allowedExtensions: readonly string[]
  maxFileSizeBytes: number
  maxFileSizeMb: number
  messages?: Partial<FileUploadValidationMessages>
}

export type ValidateFilesResult = {
  validFiles: File[]
  errors: string[]
}

const DEFAULT_FILE_UPLOAD_MESSAGES: FileUploadValidationMessages = {
  invalidType: (file, allowedExtensionsLabel) => `${file.name}: only ${allowedExtensionsLabel} files are supported.`,
  invalidSize: (file, maxFileSizeMb) => `${file.name}: file size must be less than ${maxFileSizeMb} MB.`,
  duplicated: (file) => `${file.name}: this file is already selected.`,
}

export function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()

  return extension ? normalizeFileExtension(extension) : ''
}

export function normalizeFileExtension(extension: string) {
  return extension.replace('.', '').toLowerCase()
}

export function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

export function formatBytes(sizeInBytes: number | null | undefined): string {
  if (typeof sizeInBytes !== 'number' || !Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
    return '—'
  }

  if (sizeInBytes === 0) return '0 B'
  if (sizeInBytes < 1024) return `${sizeInBytes} B`

  const sizeInKb = sizeInBytes / 1024
  if (sizeInKb < 1024) return `${sizeInKb.toFixed(1)} KB`

  const sizeInMb = sizeInKb / 1024
  if (sizeInMb < 1024) return `${sizeInMb.toFixed(1)} MB`

  const sizeInGb = sizeInMb / 1024

  return `${sizeInGb.toFixed(1)} GB`
}

export function formatAllowedExtensionsLabel(allowedExtensions: readonly string[]) {
  return allowedExtensions.map((extension) => normalizeFileExtension(extension).toUpperCase()).join(', ')
}

export function isFileTypeAllowed(file: File, allowedExtensions: readonly string[]) {
  const fileExtension = getFileExtension(file.name)

  if (!fileExtension) return false

  const allowedExtensionsSet = new Set(allowedExtensions.map(normalizeFileExtension))

  return allowedExtensionsSet.has(fileExtension)
}

export function isFileSizeAllowed(file: File, maxFileSizeBytes: number) {
  return file.size <= maxFileSizeBytes
}

export function isDuplicatedFile(file: File, currentFiles: File[]) {
  const currentFileKeys = new Set(currentFiles.map(getFileKey))

  return currentFileKeys.has(getFileKey(file))
}

export function validateFiles(
  selectedFiles: File[],
  currentFiles: File[],
  config: FileUploadValidationConfig
): ValidateFilesResult {
  const { allowedExtensions, maxFileSizeBytes, maxFileSizeMb, messages } = config

  const currentFileKeys = new Set(currentFiles.map(getFileKey))
  const allowedExtensionsSet = new Set(allowedExtensions.map(normalizeFileExtension))
  const allowedExtensionsLabel = formatAllowedExtensionsLabel(allowedExtensions)

  const validationMessages: FileUploadValidationMessages = {
    ...DEFAULT_FILE_UPLOAD_MESSAGES,
    ...messages,
  }

  const validFiles: File[] = []
  const errors: string[] = []

  selectedFiles.forEach((file) => {
    const fileExtension = getFileExtension(file.name)

    if (!fileExtension || !allowedExtensionsSet.has(fileExtension)) {
      errors.push(validationMessages.invalidType(file, allowedExtensionsLabel))
      return
    }

    if (!isFileSizeAllowed(file, maxFileSizeBytes)) {
      errors.push(validationMessages.invalidSize(file, maxFileSizeMb))
      return
    }

    if (currentFileKeys.has(getFileKey(file))) {
      errors.push(validationMessages.duplicated(file))
      return
    }

    validFiles.push(file)
  })

  return {
    validFiles,
    errors,
  }
}

export function createFilesValidator(config: FileUploadValidationConfig) {
  return function validateSelectedFiles(selectedFiles: File[], currentFiles: File[]) {
    return validateFiles(selectedFiles, currentFiles, config)
  }
}
