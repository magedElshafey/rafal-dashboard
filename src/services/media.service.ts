import { $http } from '@/utils/http'

export type MediaDeleteResponse = { success: boolean; message: string }

export const mediaService = {
  async delete(id: number) {
    return (
      await $http.delete<MediaDeleteResponse>({
        url: `/dashboard/media/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}
