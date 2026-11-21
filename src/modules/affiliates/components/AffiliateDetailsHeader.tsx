import { useState } from 'react'
import { ArrowLeft, Ban, KeyRound, Pencil, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { AffiliateActionDialog } from '@/modules/affiliates/components/AffiliateActionDialog'
import { AffiliateEditDrawer } from '@/modules/affiliates/components/AffiliateEditDrawer'
import { AffiliateStatusBadge } from '@/modules/affiliates/components/AffiliateStatusBadge'
import type { Affiliate } from '@/modules/affiliates/types/affiliate.types'
import { Routes } from '@/routes/routes'

type Action = 'suspend' | 'reactivate' | 'resetPassword'

export function AffiliateDetailsHeader({
  affiliate,
  refreshing = false,
}: {
  affiliate: Affiliate
  refreshing?: boolean
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const statusAction = affiliate.status === 'active' ? 'suspend' : 'reactivate'

  return (
    <>
      <DashboardPageHeader
        title={<bdi className="block [overflow-wrap:anywhere]">{affiliate.name}</bdi>}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <AffiliateStatusBadge status={affiliate.status} />
            <code dir="ltr" className="rounded bg-muted px-2 py-1 font-semibold">
              {affiliate.code}
            </code>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to={Routes.affiliates}>
                <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
                {t('affiliates.actions.back')}
              </Link>
            </Button>
            <Button variant="outline" disabled={refreshing} onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
              {t('affiliates.actions.edit')}
            </Button>
            <Button variant="outline" disabled={refreshing} onClick={() => setAction('resetPassword')}>
              <KeyRound aria-hidden="true" />
              {t('affiliates.actions.resetPassword')}
            </Button>
            <Button
              variant={statusAction === 'suspend' ? 'destructive' : 'default'}
              disabled={refreshing}
              onClick={() => setAction(statusAction)}
            >
              {statusAction === 'suspend' ? <Ban aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
              {t(`affiliates.actions.${statusAction}`)}
            </Button>
          </>
        }
      />
      <AffiliateEditDrawer affiliate={affiliate} open={editing} onOpenChange={setEditing} />
      {action ? (
        <AffiliateActionDialog
          key={action}
          affiliateId={affiliate.id}
          action={action}
          open
          onOpenChange={(open) => !open && setAction(null)}
        />
      ) : null}
    </>
  )
}
