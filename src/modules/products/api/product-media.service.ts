import { mediaService } from '@/services/media.service'

export const productMediaService = {
  delete: (id: number) => mediaService.delete(id),
}
