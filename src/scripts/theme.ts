import { getOrElse, match } from '../domain/adt.ts';
import {
  extractTheme,
  invertTheme,
  parseTheme,
  resolveThemePreference,
  type Theme,
  type ThemePreference,
} from '../domain/theme.ts';

const STORAGE_KEY = 'cv-theme';

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures in restricted privacy modes
  }
}

function getEffectiveTheme(): Theme {
  const fromDom = parseTheme(document.documentElement.getAttribute('data-theme'));
  return getOrElse(fromDom, () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return extractTheme(resolveThemePreference(readStoredTheme(), prefersDark));
  });
}

function syncToggleButtons(theme: Theme): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  for (const btn of buttons) {
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    const nextLabel = isDark
      ? (btn.dataset.labelLight ?? 'Switch to light theme')
      : (btn.dataset.labelDark ?? 'Switch to dark theme');
    btn.setAttribute('aria-label', nextLabel);
    btn.setAttribute('title', nextLabel);

    const textEl = btn.querySelector<HTMLElement>('[data-theme-label]');
    if (textEl) {
      textEl.textContent = isDark
        ? (btn.dataset.shortLight ?? 'Light')
        : (btn.dataset.shortDark ?? 'Dark');
    }
  }
}

function applyPreference(preference: ThemePreference): void {
  const theme = extractTheme(preference);
  document.documentElement.setAttribute('data-theme', theme);
  match(preference, {
    Stored: ({ theme: storedTheme }) => writeStoredTheme(storedTheme),
    System: () => undefined,
  });
  syncToggleButtons(theme);
}

export function initThemeToggle(): void {
  syncToggleButtons(getEffectiveTheme());

  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const next = invertTheme(getEffectiveTheme());
      applyPreference({ _tag: 'Stored', theme: next });
    });
  }

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', (event) => {
    const pref = resolveThemePreference(readStoredTheme(), event.matches);
    match(pref, {
      Stored: () => undefined,
      System: (systemPref) => applyPreference(systemPref),
    });
  });
}

initThemeToggle();
