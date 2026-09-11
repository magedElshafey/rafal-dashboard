// Utils
import { cn } from '@/lib/utils'

// UI Components
import { Button } from '@/components/ui/button'

// Types
import type { TableActionProps } from '@/components/ui/Table/types'

// Icons
import { Pencil, Eye, Trash2 } from 'lucide-react'

// i18n
import { useTranslation } from 'react-i18next'

// Icon variants per action
export const tableVariants = {
  Edit: <Pencil className="text-yellow-600" size={20} />,
  Delete: <Trash2 className="text-red-500" size={20} />,
  View: <Eye className="text-blue-900" size={20} />,
} as const

function TableAction({ tableActionVariant, className, onClick, children, ...restProps }: TableActionProps) {
  const { t } = useTranslation()

  const labelKey = `button.${tableActionVariant?.toLowerCase()}`

  return (
    <Button
      className={cn('!px-3 hover:text-brand-500 w-full flex justify-start items-center h-8 py-1 ', className)}
      variant="ghost"
      data-type={tableActionVariant}
      aria-label={t(labelKey)}
      title={t(labelKey)}
      onClick={onClick}
      {...restProps}
    >
      {tableActionVariant ? (
        <>
          {tableVariants[tableActionVariant]}
          {t(labelKey)}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { TableAction }
