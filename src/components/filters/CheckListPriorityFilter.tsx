import useGetPriorites from '@/hooks/ddl/priority/useGetPriorites'
import { useTranslation } from 'react-i18next'
import FilterSelect from './FilterSelect'

const CheckListPriorityFilter = () => {
  const { t } = useTranslation()
  const { data } = useGetPriorites()
  console.log('dddddddddd', data)
  const priorityOptions = [
    {
      label: t('priority.normal', { defaultValue: 'Normal' }),
      value: 'normal',
    },
    {
      label: t('priority.high', { defaultValue: 'High' }),
      value: 'high',
    },
    {
      label: t('priority.urgent', { defaultValue: 'Urgent' }),
      value: 'urgent',
    },
  ]

  return (
    <FilterSelect
      name="priority"
      label={t('label.priority')}
      data={priorityOptions}
      labelKey={'label'}
      valueKey={'value'}
    />
  )
}

export default CheckListPriorityFilter
