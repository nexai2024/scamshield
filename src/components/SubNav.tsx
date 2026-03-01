import { useEffect, useState } from 'react';

export interface SubNavLink {
  id: string;
  label: string;
}

interface SubNavProps {
  links: SubNavLink[];
  isDark?: boolean;
  className?: string;
}

export function SubNav({ links, isDark = true, className = '' }: SubNavProps) {
  const [activeId, setActiveId] = useState(links[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('id');
            if (id) setActiveId(id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [links]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const linkBase = isDark
    ? 'text-slate-400 hover:text-white transition-colors'
    : 'text-slate-500 hover:text-slate-900 transition-colors';
  const linkActive = isDark ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium';

  return (
    <nav
      className={`sticky top-16 z-40 border-b py-3 ${isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-slate-100/95 border-slate-200'} backdrop-blur-md ${className}`}
      aria-label="Page sections"
    >
      <div className={`${'max-w-6xl mx-auto px-4'} flex flex-wrap gap-4 justify-center`}>
        {links.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`text-sm ${activeId === id ? linkActive : linkBase}`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
