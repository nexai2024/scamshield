export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { guardLeadsRateLimit } from '@/lib/rateLimit/guard';
import { createLead, isLeadsStorageConfigured } from '@/lib/server/leads';

type LeadBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  note?: string;
  /** Honeypot — must stay empty */
  website?: string;
};

export async function POST(request: NextRequest) {
  const rateLimited = await guardLeadsRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as LeadBody;
    const { firstName, lastName, email, note, website } = body ?? {};

    if (website && String(website).trim().length > 0) {
      return NextResponse.json({ success: true, id: 'ok' }, { status: 201 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const result = await createLead({ firstName, lastName, email, note });

    if (!result.ok) {
      if (result.reason === 'storage_unavailable') {
        return NextResponse.json(
          {
            error: isLeadsStorageConfigured()
              ? 'Lead storage is temporarily unavailable. Please try again.'
              : 'Lead capture is not configured. Contact support or try the free scanner.',
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, id: result.id, duplicate: result.duplicate ?? false },
      { status: 201 }
    );
  } catch (err) {
    console.error('Lead creation error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
