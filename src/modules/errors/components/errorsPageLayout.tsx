// hooks
import { useTranslation } from 'react-i18next'

// components
import MainErrorButtons from '@/modules/errors/components/mainErrorButtons'

// types
import { ErrorPageProps } from '@/modules/errors/types'

export default function ErrorsPageLayout({
  title,
  desc1,
  desc2,
  code,
  mainButton = <MainErrorButtons className="mt-2" />,
}: ErrorPageProps) {
  const { t } = useTranslation()
  return (
    <section className="m-auto flex min-h-screen w-full flex-col items-center justify-center gap-3 ">
      <h1 className="text-[7rem] leading-tight font-bold">{code}</h1>
      <span className="font-medium">{t(`errors.${title}`)}</span>
      <p className="text-muted-foreground text-center">
        {`${t(`errors.${desc1}`)}`}
        <br />
        {`${t(`errors.${desc2}`)}`}
      </p>
      {mainButton}
    </section>
  )
}
