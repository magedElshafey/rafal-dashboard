import type { Config } from 'dompurify'

export const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',

    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',

    'ul',
    'ol',
    'li',

    'blockquote',
    'hr',

    'a',

    'code',
    'pre',

    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],

  ALLOWED_ATTR: ['href', 'title', 'colspan', 'rowspan'],

  // الـ styling والـ classes مسؤولية الـ frontend فقط.
  FORBID_ATTR: ['style', 'class', 'id', 'target', 'rel'],

  FORBID_TAGS: [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option',
    'svg',
    'math',
  ],

  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
} satisfies Config
