'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const viewportOnce = { once: true, margin: '-60px' as `${number}px` };

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  from = 'bottom',
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  from?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  className?: string;
}) {
  const dirs: Record<string, { x: number; y: number }> = {
    bottom: { y: 20, x: 0 },
    top: { y: -20, x: 0 },
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
  };
  return (
    <motion.div
      initial={{ opacity: 0, ...dirs[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({
  value,
  prefix,
  suffix,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      hasAnimated.current = true;
      const steps = 60;
      const inc = value / steps;
      let cur = 0;
      const t = setInterval(() => {
        cur += inc;
        if (cur >= value) {
          setCount(value);
          clearInterval(t);
        } else setCount(Math.floor(cur));
      }, 1500 / steps);
      return () => clearInterval(t);
    }
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
      {prefix ?? ''}
      {count}
      {suffix ?? ''}
    </span>
  );
}
