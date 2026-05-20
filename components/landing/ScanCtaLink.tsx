import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_LINKS } from '@/lib/landing/constants';

type ScanCtaLinkProps = {
  className?: string;
  children?: React.ReactNode;
  showArrow?: boolean;
  onClick?: () => void;
};

export function ScanCtaLink({ className, children, showArrow = true, onClick }: ScanCtaLinkProps) {
  return (
    <Link
      href={APP_LINKS.dashboard}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors group',
        className
      )}
    >
      {children ?? (
        <>
          Scan for FREE
          {showArrow && (
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
        </>
      )}
    </Link>
  );
}
