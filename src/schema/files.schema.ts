import { array, mixed } from 'yup'

import { t } from '@/modules/auth/schema'

export const FilesRequiredSchema = array()
  .of(
    mixed<File>()
      .required()
      .test(
        'is-file',
        () => t('exams.upload_submission.invalid_file'),
        (value) => value instanceof File
      )
  )
  .min(1, () => t('exams.upload_submission.files_required'))
  .required(() => t('exams.upload_submission.files_required'))
  .default([])
