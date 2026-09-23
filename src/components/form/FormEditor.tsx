import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Redo2, Undo2 } from 'lucide-react'
import { useEffect, useId } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type FormEditorProps = {
  name: string
  label?: string
  disabled?: boolean
  required?: boolean
  dir?: 'rtl' | 'ltr'
  className?: string
}

type EditorFieldProps = Omit<FormEditorProps, 'name'> & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  labelId?: string
}

function EditorField({
  value,
  onChange,
  onBlur,
  disabled = false,
  dir = 'ltr',
  className,
  labelId,
  required,
}: EditorFieldProps) {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        hardBreak: false,
        horizontalRule: false,
        link: false,
        strike: false,
        underline: false,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId ?? '',
        'aria-required': required ? 'true' : 'false',
        dir,
        class: cn(
          'min-h-32 px-3 py-2 text-sm text-foreground outline-none',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold',
          '[&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6 [&_p]:min-h-5',
          className
        ),
      },
    },
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.isEmpty ? '' : nextEditor.getHTML()),
    onBlur,
  })

  useEffect(() => {
    if (!editor) return
    const currentValue = editor.isEmpty ? '' : editor.getHTML()
    if (currentValue !== value) editor.commands.setContent(value, { emitUpdate: false })
    if (editor.isEmpty && value !== '') onChange('')
  }, [editor, onChange, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor) return
    editor.view.dom.setAttribute('dir', dir)
    if (labelId) editor.view.dom.setAttribute('aria-labelledby', labelId)
    else editor.view.dom.removeAttribute('aria-labelledby')
    if (required) editor.view.dom.setAttribute('aria-required', 'true')
    else editor.view.dom.removeAttribute('aria-required')
  }, [dir, editor, labelId, required])

  if (!editor) return <div className="min-h-44 rounded-md border border-border bg-muted/20" />

  const tools = [
    {
      key: 'paragraph',
      icon: Pilcrow,
      active: editor.isActive('paragraph'),
      run: () => editor.chain().focus().setParagraph().run(),
    },
    {
      key: 'heading2',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'heading3',
      icon: Heading3,
      active: editor.isActive('heading', { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    { key: 'bold', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    {
      key: 'italic',
      icon: Italic,
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'bulletList',
      icon: List,
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'undo',
      icon: Undo2,
      active: false,
      disabled: !editor.can().chain().focus().undo().run(),
      run: () => editor.chain().focus().undo().run(),
    },
    {
      key: 'redo',
      icon: Redo2,
      active: false,
      disabled: !editor.can().chain().focus().redo().run(),
      run: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div
      dir={dir}
      className={cn('overflow-hidden rounded-md border border-input bg-background', disabled && 'opacity-60')}
    >
      <div
        role="toolbar"
        aria-label={t('formEditor.toolbar.label')}
        className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-1"
        dir="ltr"
      >
        {tools.map(({ key, icon: Icon, active, disabled: toolDisabled, run }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={disabled || toolDisabled}
                aria-label={t(`formEditor.toolbar.${key}`)}
                aria-pressed={active}
                onClick={run}
              >
                <Icon aria-hidden="true" className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t(`formEditor.toolbar.${key}`)}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <FormControl>
        <EditorContent editor={editor} />
      </FormControl>
    </div>
  )
}

export function FormEditor({ name, label, required, ...props }: FormEditorProps) {
  const { control } = useFormContext()
  const labelId = useId()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? (
            <FormLabel id={labelId}>
              {label}
              {required ? (
                <span aria-hidden="true" className="ms-1 text-destructive">
                  *
                </span>
              ) : null}
            </FormLabel>
          ) : null}
          <EditorField
            {...props}
            required={required}
            label={label}
            labelId={label ? labelId : undefined}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
