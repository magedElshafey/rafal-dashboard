import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
import { blogCategoriesService } from '@/modules/blogs/api/blog-categories.service'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
export function useDeleteBlogCategory() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: blogCategoriesService.delete,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: blogCategoriesKeys.lists() }),
        client.cancelQueries({ queryKey: blogPostsKeys.lists() }),
      ])
      // Keep the last complete server snapshot: membership, ordering and totals must agree.
      // Cancel first so an older request cannot overwrite the authoritative refetch.
      await Promise.all([
        client.invalidateQueries({ queryKey: blogCategoriesKeys.lists() }),
        // The relationship after deletion is unspecified; do not fabricate a local post update.
        client.invalidateQueries({ queryKey: blogPostsKeys.lists(), refetchType: 'none' }),
      ])
      toast.success(t('blogCategories.deleted'))
    },
    onError: (error) => toastApiError(error, t('blogCategories.deleteError')),
  })
}
