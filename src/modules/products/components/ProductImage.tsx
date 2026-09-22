import { ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

type Props = {
  url: string | null
  name: string
  className?: string
}

export function ProductImage({ url, name, className }: Props) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [url])

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={t('products.noImage')}
        className={cn(
          'flex aspect-square size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
          className
        )}
      >
        <ImageIcon aria-hidden="true" className="size-5" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={t('products.imageAlt', { name })}
      loading="lazy"
      className={cn('aspect-square size-14 shrink-0 rounded-lg object-cover', className)}
      onError={() => setFailed(true)}
    />
  )
}
