import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { blogCategoriesService } from '@/modules/blogs/api/blog-categories.service'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
export function useCreateBlogCategory() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: blogCategoriesService.create,
    retry: false,
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: blogCategoriesKeys.lists() })
      await client.invalidateQueries({ queryKey: blogCategoriesKeys.lists() })
      toast.success(t('blogCategories.created'))
    },
    onError: (error) => toastApiError(error, t('blogCategories.createError')),
  })
}
