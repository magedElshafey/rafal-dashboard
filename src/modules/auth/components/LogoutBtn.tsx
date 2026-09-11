import LogoutIcon from '@/components/icons/LogoutIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { LogoutDialog } from '@/modules/auth/components/LogoutDialog'

type LogoutBtnProps = {
  className?: string
  variant?: 'dropdown' | 'sidebar'
}

const LogoutBtn = ({ className = '', variant = 'sidebar' }: LogoutBtnProps) => {
  const { t } = useTranslation()

  const content = (
    <>
      <LogoutIcon />
      <span>{t('button.logout')}</span>
    </>
  )

  const trigger =
    variant === 'dropdown' ? (
      <DropdownMenuItem
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-none px-3 text-start text-sm font-normal text-[#D93E3E] transition-colors',
          'bg-[#FDECEC] hover:bg-[#FDECEC] hover:text-[#D93E3E]',
          'focus:bg-[#FDECEC] focus:text-[#D93E3E]',
          className
        )}
        onSelect={(event) => event.preventDefault()}
      >
        {content}
      </DropdownMenuItem>
    ) : (
      <Button
        type="button"
        className={cn(
          'flex h-9 w-full items-center justify-start gap-2',
          'bg-[#FDECEC] text-start text-sm font-normal text-[#D93E3E] shadow-none',
          'hover:bg-[#FDECEC] hover:text-[#D93E3E]',
          className
        )}
      >
        {content}
      </Button>
    )

  return <LogoutDialog trigger={trigger} />
}

export default LogoutBtn
