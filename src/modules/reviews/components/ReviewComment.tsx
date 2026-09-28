import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  reviewId: number
  comment: string
}

export function ReviewComment({ reviewId, comment }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const commentId = useId()

  return (
    <div className="max-w-md space-y-1">
      <p id={commentId} className={cn('whitespace-normal', !expanded && 'line-clamp-2')} dir="auto">
        {comment}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-1 text-xs"
        aria-expanded={expanded}
        aria-controls={commentId}
        aria-label={t(expanded ? 'reviews.comments.collapseForReview' : 'reviews.comments.showFullForReview', {
          id: reviewId,
        })}
        onClick={() => setExpanded((current) => !current)}
      >
        {t(expanded ? 'reviews.comments.collapse' : 'reviews.comments.showFull')}
      </Button>
    </div>
  )
}
