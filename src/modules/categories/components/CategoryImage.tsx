import { ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

type CategoryImageProps = {
  url: string | null
  alt: string
  className?: string
}

export function CategoryImage({ url, alt, className }: CategoryImageProps) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [url])

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={t('categories.noImage')}
        className={cn(
          'flex aspect-square size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-black-50 text-content-secondary',
          className
        )}
      >
        <ImageIcon className="size-5" aria-hidden="true" />
        <span className="sr-only">{t('categories.noImage')}</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn('aspect-square size-14 rounded-lg object-cover', className)}
      onError={() => setFailed(true)}
    />
  )
}
