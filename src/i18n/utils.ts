import { getRelativeLocaleUrl } from 'astro:i18n';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  matchLocale,
  type Locale,
} from './config';
import { UI, type UiStrings } from './ui';

export function getUi(locale: Locale): UiStrings {
  return UI[locale];
}

export function getLocalizedPath(locale: Locale): string {
  return getRelativeLocaleUrl(locale);
}

export function getAbsoluteUrl(site: URL | undefined, path: string): string {
  const base = site ?? new URL('https://neatblackcrow.github.io');
  return new URL(path, base).toString();
}

export interface AlternateLink {
  readonly locale: Locale;
  readonly hreflang: string;
  readonly href: string;
  readonly relativePath: string;
  readonly label: string;
  readonly nativeLabel: string;
}

export function getAlternateLinks(site: URL | undefined): AlternateLink[] {
  return LOCALES.map((locale) => {
    const relativePath = getLocalizedPath(locale);
    const { htmlLang, label, nativeLabel } = LOCALE_META[locale];
    return {
      locale,
      hreflang: htmlLang,
      href: getAbsoluteUrl(site, relativePath),
      relativePath,
      label,
      nativeLabel,
    };
  });
}

export function getDefaultCanonicalUrl(site: URL | undefined): string {
  return getAbsoluteUrl(site, getLocalizedPath(DEFAULT_LOCALE));
}

export function formatLastUpdated(isoDate: string, locale: Locale): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  const intlLocale = matchLocale(locale, {
    en: () => 'en-US',
    th: () => 'th-TH-u-ca-gregory',
  });
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
