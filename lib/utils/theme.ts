import type { ThemeMode } from '@/lib/types';

const KEY = 'scamshield_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'dark' || t === 'light' || t === 'system') return t;
  } catch {
    // ignore
  }
  return 'light';
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // ignore
  }
}

export function getEffectiveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function applyTheme(mode: ThemeMode): void {
  const effective = getEffectiveTheme(mode);
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(effective);
  document.documentElement.setAttribute('data-theme', effective);
}
