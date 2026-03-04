import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
