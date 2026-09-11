import { useTranslation } from 'react-i18next'

const SidebarItem = () => {
  const { t } = useTranslation()

  return <div>{t('teachers_layout.sidebar_item')}</div>
}

export default SidebarItem
