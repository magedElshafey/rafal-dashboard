import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { blogPostsService } from '@/modules/blogs/api/blog-posts.service'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
export function useCreateBlogPost() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: blogPostsService.create,
    retry: false,
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: blogPostsKeys.lists() })
      await client.invalidateQueries({ queryKey: blogPostsKeys.lists() })
      toast.success(t('blogPosts.created'))
    },
    onError: (error) => toastApiError(error, t('blogPosts.createError')),
  })
}
