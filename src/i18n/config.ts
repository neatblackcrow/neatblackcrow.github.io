export const DEFAULT_LOCALE = 'en' as const;
export const LOCALES = ['en', 'th'] as const;

export type Locale = (typeof LOCALES)[number];

export type LocaleRecord<T> = Readonly<Record<Locale, T>>;

export interface LocaleConfig {
  readonly code: Locale;
  readonly label: string;
  readonly nativeLabel: string;
  readonly htmlLang: string;
  readonly ogLocale: string;
  readonly dir: 'ltr' | 'rtl';
  readonly pdfPath: string;
  readonly pdfFilename: string;
  readonly promptFile: string;
}

export const LOCALE_META: LocaleRecord<LocaleConfig> = {
  en: {
    code: 'en',
    label: 'EN',
    nativeLabel: 'English',
    htmlLang: 'en',
    ogLocale: 'en_US',
    dir: 'ltr',
    pdfPath: '/cv.pdf',
    pdfFilename: 'Voravut-Nateluercha-CV-EN.pdf',
    promptFile: 'cv.en.yaml',
  },
  th: {
    code: 'th',
    label: 'TH',
    nativeLabel: 'ไทย',
    htmlLang: 'th',
    ogLocale: 'th_TH',
    dir: 'ltr',
    pdfPath: '/cv-th.pdf',
    pdfFilename: 'Voravut-Nateluercha-CV-TH.pdf',
    promptFile: 'cv.th.yaml',
  },
};

export function matchLocale<R>(
  locale: Locale,
  handlers: Readonly<Record<Locale, () => R>>,
): R {
  return handlers[locale]();
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'th';
}
