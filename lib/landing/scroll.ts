import { LANDING_HEADER_OFFSET } from '@/lib/landing/constants';

/** Smooth-scroll to an in-page anchor, accounting for the fixed landing header. */
export function scrollToLandingSection(id: string) {
  if (id === '#') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.querySelector(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - LANDING_HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  if (typeof history !== 'undefined' && history.pushState) {
    history.pushState(null, '', id);
  }
}
