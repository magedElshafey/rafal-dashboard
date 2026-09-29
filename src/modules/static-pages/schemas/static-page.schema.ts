import * as yup from 'yup'

import { normalizeStaticPageSlug } from '@/modules/static-pages/utils/static-page.utils'

type Messages = {
  slugRequired: string
}

export function createStaticPageSchema(messages: Messages) {
  const optionalText = yup.string().defined()
  return yup.object({
    slug: yup
      .string()
      .defined()
      .test('normalized-slug-required', messages.slugRequired, (value) => normalizeStaticPageSlug(value).length > 0),
    title: yup.object({ ar: optionalText, en: optionalText }),
    content: yup.object({ ar: optionalText, en: optionalText }),
    isPublished: yup.boolean().required(),
  })
}
