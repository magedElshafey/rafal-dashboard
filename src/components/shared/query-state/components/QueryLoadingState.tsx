import type { ReactNode } from 'react'

import { useTranslation } from 'react-i18next'

type QueryLoadingStateProps = {
  fallback: ReactNode
}

export function QueryLoadingState({ fallback }: QueryLoadingStateProps) {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy="true" data-testid="query-loading-state">
      <span className="sr-only">{t('queryState.loading')}</span>

      <div aria-hidden="true">{fallback}</div>
    </div>
  )
}
