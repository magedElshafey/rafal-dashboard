import { useMemo, type ReactNode } from 'react'
import DOMPurify from 'dompurify'
import parse, { DOMNode, Element, domToReact, type HTMLReactParserOptions } from 'html-react-parser'

import { cn } from '@/lib/utils'

import { SAFE_HTML_CONFIG } from './safe-html.config'

type SafeHtmlContentProps = {
  html: Nullable<string>
  className?: string
  emptyFallback?: ReactNode
  variant?: 'default' | 'compact'
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

const SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i

function getSafeHref(value: string | undefined): string | null {
  const href = value?.trim()

  if (!href) {
    return null
  }

  if (href.startsWith('//')) {
    return null
  }

  /*
   * Allow:
   * /assignments/1
   * ./file
   * ../file
   * #section
   * assignments/1
   */
  if (!SCHEME_PATTERN.test(href)) {
    return href
  }

  try {
    const url = new URL(href)

    return SAFE_PROTOCOLS.has(url.protocol) ? href : null
  } catch {
    return null
  }
}

function isAbsoluteWebUrl(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function createParserOptions(linkClassName: string): HTMLReactParserOptions {
  const options: HTMLReactParserOptions = {
    replace(domNode: any) {
      if (!(domNode instanceof Element)) {
        return
      }

      if (domNode.name !== 'a') {
        return
      }

      const children = domToReact(domNode.children as DOMNode[], options)
      const href = getSafeHref(domNode.attribs.href)

      if (!href) {
        return <span>{children}</span>
      }

      const opensInNewTab = isAbsoluteWebUrl(href)

      return (
        <a
          href={href}
          title={domNode.attribs.title}
          className={linkClassName}
          {...(opensInNewTab
            ? {
                target: '_blank',
                rel: 'noopener noreferrer',
              }
            : {})}
        >
          {children}
        </a>
      )
    },
  }

  return options
}

const VARIANT_CLASSES = {
  default: cn(
    '[&_h1]:mb-4',
    '[&_h1]:mt-6',
    '[&_h1]:text-3xl',
    '[&_h1]:font-bold',

    '[&_h2]:mb-3',
    '[&_h2]:mt-6',
    '[&_h2]:text-2xl',
    '[&_h2]:font-bold',

    '[&_h3]:mb-2',
    '[&_h3]:mt-5',
    '[&_h3]:text-xl',
    '[&_h3]:font-semibold',

    '[&_h4]:mb-2',
    '[&_h4]:mt-4',
    '[&_h4]:text-lg',
    '[&_h4]:font-semibold',

    '[&_ul]:my-4',
    '[&_ul]:list-disc',
    '[&_ul]:ps-6',

    '[&_ol]:my-4',
    '[&_ol]:list-decimal',
    '[&_ol]:ps-6',

    '[&_li]:my-1',

    '[&_blockquote]:my-4',
    '[&_blockquote]:border-s-4',
    '[&_blockquote]:border-border',
    '[&_blockquote]:ps-4',
    '[&_blockquote]:italic',
    '[&_blockquote]:text-content-secondary',

    '[&_pre]:my-4',
    '[&_pre]:overflow-x-auto',
    '[&_pre]:rounded-lg',
    '[&_pre]:bg-muted',
    '[&_pre]:p-4',

    '[&_code]:rounded',
    '[&_code]:bg-muted',
    '[&_code]:px-1.5',
    '[&_code]:py-0.5',
    '[&_code]:font-mono',
    '[&_code]:text-sm',

    '[&_pre_code]:bg-transparent',
    '[&_pre_code]:p-0',

    '[&_table]:my-4',
    '[&_table]:w-full',
    '[&_table]:border-collapse',

    '[&_th]:border',
    '[&_th]:border-border',
    '[&_th]:p-3',
    '[&_th]:text-start',
    '[&_th]:font-semibold',

    '[&_td]:border',
    '[&_td]:border-border',
    '[&_td]:p-3',

    '[&_hr]:my-6',
    '[&_hr]:border-border',

    '[&_strong]:font-semibold'
  ),

  compact: cn(
    // Paragraphs as normal lines
    '[&_p]:m-0',
    '[&_p]:leading-5',
    '[&_p+p]:mt-1',

    // Lists as normal lines without bullets
    '[&_ul]:m-0',
    '[&_ul]:list-none',
    '[&_ul]:p-0',

    '[&_ol]:m-0',
    '[&_ol]:list-none',
    '[&_ol]:p-0',

    '[&_li]:m-0',
    '[&_li]:p-0',
    '[&_li]:leading-5',

    // Hide: <li><br /></li>
    '[&_li:has(>br:only-child)]:hidden',

    '[&_h1]:my-2',
    '[&_h1]:text-xl',
    '[&_h1]:font-bold',

    '[&_h2]:my-2',
    '[&_h2]:text-lg',
    '[&_h2]:font-semibold',

    '[&_h3]:my-1.5',
    '[&_h3]:font-semibold'
  ),
} satisfies Record<NonNullable<SafeHtmlContentProps['variant']>, string>

export function SafeHtmlContent({ html, className, emptyFallback = null, variant = 'default' }: SafeHtmlContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html?.trim()) {
      return ''
    }

    return DOMPurify.sanitize(html, SAFE_HTML_CONFIG)
  }, [html])

  const parserOptions = useMemo(
    () =>
      createParserOptions(
        cn(
          'font-medium',
          'text-primary',
          'underline',
          'underline-offset-4',
          'transition-opacity',
          'hover:opacity-80',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-ring'
        )
      ),
    []
  )

  const content = useMemo(() => {
    if (!sanitizedHtml) {
      return null
    }

    return parse(sanitizedHtml, parserOptions)
  }, [parserOptions, sanitizedHtml])

  if (!content) {
    return emptyFallback
  }

  return (
    <div dir="auto" className={cn('min-w-0 break-words text-content-primary', VARIANT_CLASSES[variant], className)}>
      {content}
    </div>
  )
}
