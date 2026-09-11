import { observer } from '@/utils/observer'

export const copyToClipboard = async (text: string, message: string): Promise<void> => {
  await navigator.clipboard.writeText(text)
  observer.fire('notify', {
    type: 'success',
    message,
  })
}
