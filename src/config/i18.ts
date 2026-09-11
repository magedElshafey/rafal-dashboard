import env from '@/config/env'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Yup from 'yup'
import { resources } from '@/lang/resources'

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem(env.LOCALE_KEY) || env.DEFAULT_LOCALE,
  fallbackLng: env.DEFAULT_LOCALE,
  supportedLngs: ['ar', 'en'],
  interpolation: {
    escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
  },
})

function syncDocumentLanguage(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = i18n.dir(language)
  localStorage.setItem(env.LOCALE_KEY, language)
}

i18n.on('languageChanged', syncDocumentLanguage)
syncDocumentLanguage(i18n.language || env.DEFAULT_LOCALE)

export default i18n

Yup.setLocale({
  mixed: {
    required: i18n.t('validations.required'),
  },
  string: {
    email: i18n.t('validations.email'),
    min: (props) => {
      return i18n.t('validations.min', {
        name: i18n.t(`label.${props.path}`),
        min: props.min,
      })
    },
  },
  array: {
    min: (props) => {
      return i18n.t('validations.min_array_length', {
        name: i18n.t(`label.${props.path}`),
        min: props.min,
      })
    },
  },
  number: {
    lessThan: (props) => {
      return i18n.t('validations.less_than', {
        name: i18n.t(`label.${props.path}`),
        less: props.less,
      })
    },
    moreThan: (props) => {
      return i18n.t('validations.more_than', {
        name: i18n.t(`label.${props.path}`),
        more: props.more,
      })
    },
    max: (props) => {
      return i18n.t('validations.less_than_or_equal', {
        name: i18n.t(`label.${props.path}`),
        less: props.max,
      })
    },
    min: (props) => {
      return i18n.t('validations.more_than_or_equal', {
        name: i18n.t(`label.${props.path}`),
        more: props.min,
      })
    },
    positive: (props) => {
      return i18n.t('validations.positive', {
        name: i18n.t(`label.${props.path}`),
      })
    },
  },
})

Yup.addMethod(Yup.MixedSchema, 'oneOfSchemas', function (schemas: Yup.AnySchema[]) {
  return this.test('one-of-schemas', i18n.t('validations.one_of_email_or_phone'), (item) =>
    schemas.some((schema) => schema.isValidSync(item, { strict: true }))
  )
})
