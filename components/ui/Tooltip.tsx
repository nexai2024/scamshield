'use client';

import { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  label: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, label, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const pos: Record<string, string> = { top: 'bottom-full left-1/2 -translate-x-1/2 mb-2', bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', left: 'right-full top-1/2 -translate-y-1/2 mr-2', right: 'left-full top-1/2 -translate-y-1/2 ml-2' };
  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && <span className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${pos[side]}`} role="tooltip">{label}</span>}
    </div>
  );
}
