import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImageUploader, type ImageUploaderProps } from './ImageUploader'
import type { ExistingImage, ImageId } from './image-upload.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      const labels: Record<string, string> = {
        'imageUploader.label': 'Images',
        'imageUploader.drag': 'Drag images here',
        'imageUploader.browse': 'Browse images',
        'imageUploader.processing': 'Checking image',
        'imageUploader.replaceInput': 'Choose a replacement image',
        'imageUploader.previewList': 'Selected image previews',
        'imageUploader.existingImage': 'Existing image',
        'imageUploader.remote': 'Existing',
        'imageUploader.selectedCount': `${values?.count} images selected`,
        'imageUploader.hint': 'Upload restrictions',
        'imageUploader.unlimited': 'Not limited',
        'imageUploader.errors.invalidType': `${values?.file} invalid type`,
        'imageUploader.errors.maxSize': `${values?.file} exceeds ${values?.size}`,
        'imageUploader.errors.maxFiles': `Maximum ${values?.count} images`,
        'imageUploader.errors.duplicate': 'Already selected',
        'imageUploader.errors.dimensions': `${values?.file} invalid dimensions`,
        'imageUploader.errors.preview': `${values?.file} unreadable`,
      }
      if (key === 'imageUploader.replaceNamed') return `Replace ${values?.name}`
      if (key === 'imageUploader.removeNamed') return `Remove ${values?.name}`
      return labels[key] ?? key
    },
  }),
}))

function Harness({
  initialFiles = [],
  existingImages = [],
  ...props
}: Partial<ImageUploaderProps> & {
  initialFiles?: File[]
  existingImages?: ExistingImage[]
}) {
  const [files, setFiles] = useState(initialFiles)
  const [removed, setRemoved] = useState<ImageId[]>([])
  return (
    <ImageUploader
      mode="single"
      files={files}
      onFilesChange={setFiles}
      existingImages={existingImages}
      removedExistingIds={removed}
      onExistingRemove={(image) => setRemoved((current) => [...current, image.id])}
      {...props}
    />
  )
}

describe('ImageUploader', () => {
  beforeEach(() => {
    let objectUrl = 0
    URL.createObjectURL = vi.fn(() => `blob:preview-${++objectUrl}`)
    URL.revokeObjectURL = vi.fn()
  })

  it('selects, previews, replaces, removes, and cleans up a single local image', async () => {
    const user = userEvent.setup()
    const first = new File(['first'], 'first.png', { type: 'image/png' })
    const second = new File(['second'], 'second.png', { type: 'image/png' })
    const { unmount } = render(<Harness />)

    await user.upload(screen.getByLabelText('Browse images'), first)
    expect(await screen.findByRole('img', { name: 'first.png' })).toHaveAttribute('src', 'blob:preview-1')

    await user.click(screen.getByRole('button', { name: 'Replace first.png' }))
    await user.upload(screen.getByLabelText('Choose a replacement image'), second)
    expect(await screen.findByRole('img', { name: 'second.png' })).toBeInTheDocument()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1'))

    await user.click(screen.getByRole('button', { name: 'Remove second.png' }))
    expect(screen.queryByRole('img', { name: 'second.png' })).not.toBeInTheDocument()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-2'))
    unmount()
  })

  it('renders and removes an existing remote image without converting it to a File', async () => {
    const user = userEvent.setup()
    render(<Harness existingImages={[{ id: 9, url: 'https://example.test/banner.jpg', alt: 'Remote banner' }]} />)

    expect(screen.getByRole('img', { name: 'Remote banner' })).toHaveAttribute('src', 'https://example.test/banner.jpg')
    await user.click(screen.getByRole('button', { name: 'Remove Remote banner' }))
    expect(screen.queryByRole('img', { name: 'Remote banner' })).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('appends multiple images, targets removal, and constrains its preview gallery', async () => {
    const user = userEvent.setup()
    render(<Harness mode="multiple" maxFiles={4} />)
    const first = new File(['one'], 'one.png', { type: 'image/png' })
    const second = new File(['two'], 'two.png', { type: 'image/png' })

    await user.upload(screen.getByLabelText('Browse images'), [first, second])
    expect(await screen.findByRole('img', { name: 'one.png' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'two.png' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Selected image previews' })).toHaveClass('max-h-80', 'overflow-y-auto')
    await user.click(screen.getByRole('button', { name: 'Remove one.png' }))
    expect(screen.queryByRole('img', { name: 'one.png' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'two.png' })).toBeInTheDocument()
  })

  it('rejects excess count, invalid type, oversized files, and duplicates with clear errors', async () => {
    const first = new File(['one'], 'one.png', { type: 'image/png' })
    const { rerender } = render(<Harness mode="multiple" maxFiles={1} initialFiles={[first]} />)
    fireEvent.change(screen.getByLabelText('Browse images'), {
      target: { files: [new File(['two'], 'two.png', { type: 'image/png' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Maximum 1 images')

    rerender(<Harness mode="multiple" maxFiles={3} accept="image/png" maxFileSize={3} />)
    fireEvent.change(screen.getByLabelText('Browse images'), {
      target: { files: [new File(['pdf'], 'bad.pdf', { type: 'application/pdf' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('bad.pdf invalid type')
    fireEvent.change(screen.getByLabelText('Browse images'), {
      target: { files: [new File(['large'], 'large.png', { type: 'image/png' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('large.png exceeds')

    rerender(<Harness mode="multiple" maxFiles={3} initialFiles={[first]} />)
    fireEvent.change(screen.getByLabelText('Browse images'), { target: { files: [first] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Already selected')
  })

  it('performs optional asynchronous dimension validation and cleans its temporary URL', async () => {
    class TestImage {
      naturalWidth = 100
      naturalHeight = 100
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', TestImage)
    render(<Harness dimensions={{ aspectRatio: 2 }} />)
    fireEvent.change(screen.getByLabelText('Browse images'), {
      target: { files: [new File(['square'], 'square.png', { type: 'image/png' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('square.png invalid dimensions')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
    vi.unstubAllGlobals()
  })

  it('keeps native accessible controls usable inside RTL and LTR containers', () => {
    const { rerender } = render(
      <div dir="rtl">
        <Harness />
      </div>
    )
    expect(screen.getByRole('group', { name: 'Images' }).closest('[dir="rtl"]')).toBeInTheDocument()
    expect(screen.getByLabelText('Browse images')).toHaveAttribute('type', 'file')

    rerender(
      <div dir="ltr">
        <Harness />
      </div>
    )
    expect(screen.getByRole('group', { name: 'Images' }).closest('[dir="ltr"]')).toBeInTheDocument()
  })
})
