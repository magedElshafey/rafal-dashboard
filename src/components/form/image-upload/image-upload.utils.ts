import type { ImageDimensions } from './image-upload.types'

export function getImageFileId(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}:${file.type}`
}

export function matchesImageAccept(file: File, accept: string) {
  if (!file.type) return true

  return accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1))
      if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule)
      return file.type.toLowerCase() === rule
    })
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_DIMENSIONS_UNAVAILABLE'))
    }
    image.src = url
  })
}

export function dimensionsAreValid(dimensions: { width: number; height: number }, constraints: ImageDimensions) {
  const { width, height } = dimensions
  if (constraints.minWidth !== undefined && width < constraints.minWidth) return false
  if (constraints.minHeight !== undefined && height < constraints.minHeight) return false
  if (constraints.maxWidth !== undefined && width > constraints.maxWidth) return false
  if (constraints.maxHeight !== undefined && height > constraints.maxHeight) return false

  if (constraints.aspectRatio !== undefined) {
    const tolerance = constraints.aspectRatioTolerance ?? 0.01
    if (Math.abs(width / height - constraints.aspectRatio) > tolerance) return false
  }

  return true
}
