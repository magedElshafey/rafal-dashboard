import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
import { mediaService } from '@/services/media.service'

const transport = env.PRODUCTS_USE_MOCK
  ? { delete: (id: number) => productsMockTransport.deleteMedia(id) }
  : mediaService

export const productMediaService = {
  delete: (id: number) => transport.delete(id),
}
