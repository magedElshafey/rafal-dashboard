import { cn } from '@/lib/utils'
import { FileAttachmentItem } from '@/components/shared/file-list/FileAttachmentItem'

type FileListProps = {
  files: Media[]
  className?: string
  emptyMessage?: string
  classNames?: {
    root?: string
    iconContainer?: string
    icon?: string
    title?: string
    size?: string
  }
}

export function FileList({ files, className, emptyMessage = 'No files attached', classNames }: FileListProps) {
  if (files.length === 0) {
    return <p className="text-sm text-content-secondary">{emptyMessage}</p>
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => (
        <FileAttachmentItem key={file.id} file={file} classNames={classNames} />
      ))}
    </div>
  )
}
