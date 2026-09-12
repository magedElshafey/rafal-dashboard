export type ImageId = string | number

export type ExistingImage = {
  id: ImageId
  url: string
  alt?: string
}

export type ImageUploadValue = {
  files: File[]
  removedExistingIds: ImageId[]
}

export type ImageDimensions = {
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: number
  aspectRatioTolerance?: number
}

export type ImagePreviewFit = 'cover' | 'contain'

export const EMPTY_IMAGE_UPLOAD_VALUE: ImageUploadValue = {
  files: [],
  removedExistingIds: [],
}
