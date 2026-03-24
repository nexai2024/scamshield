import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmailReportShell } from '@/components/EmailReportShell';
import { getEmailReport } from '@/lib/inbound/reportStorage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ScamShield — Email scan report',
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function EmailReportPage({ params }: PageProps) {
  const { token } = await params;
  if (!token || token.length > 200) notFound();

  const data = await getEmailReport(token);
  if (!data) notFound();

  return <EmailReportShell data={data} reportToken={token} />;
}
