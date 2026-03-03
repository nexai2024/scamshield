'use client';

import { useUser } from '@clerk/nextjs';
import { ScanHistory } from '@/components/ScanHistory';
import { GUEST_USER_ID } from '@/lib/constants';
import { getStoredTheme, getEffectiveTheme } from '@/lib/utils/theme';

export default function HistoryPage() {
  const { user } = useUser();
  const userId = user?.id ?? GUEST_USER_ID;
  const theme = getStoredTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';

  return <ScanHistory userId={userId} isDark={isDark} />;
}
