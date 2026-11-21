import { match, none, some, type Option } from './adt.ts';

export type Theme = 'light' | 'dark';

export type ThemePreference =
  | { readonly _tag: 'Stored'; readonly theme: Theme }
  | { readonly _tag: 'System'; readonly theme: Theme };

export function storedTheme(theme: Theme): ThemePreference {
  return { _tag: 'Stored', theme };
}

export function systemTheme(theme: Theme): ThemePreference {
  return { _tag: 'System', theme };
}

export function parseTheme(raw: string | null | undefined): Option<Theme> {
  if (raw === 'light' || raw === 'dark') {
    return some(raw);
  }
  return none;
}

export function resolveThemePreference(
  stored: string | null | undefined,
  prefersDark: boolean,
): ThemePreference {
  return match(parseTheme(stored), {
    Some: ({ value }) => storedTheme(value),
    None: () => systemTheme(prefersDark ? 'dark' : 'light'),
  });
}

export function extractTheme(pref: ThemePreference): Theme {
  return match(pref, {
    Stored: ({ theme }) => theme,
    System: ({ theme }) => theme,
  });
}

export function invertTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
