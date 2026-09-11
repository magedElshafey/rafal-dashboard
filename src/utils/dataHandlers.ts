import { IMedia } from './types'

export const filterImageArray = (mediaArray: IMedia[], fileKeyName: string, ImageKeyName: string) => {
  const files: IMedia[] = [],
    images: IMedia[] = []

  mediaArray.forEach((item) => {
    if (ImageKeyName) {
      images.push(item)
    } else if (fileKeyName) {
      files.push(item)
    }
  })

  return { files, images }
}
