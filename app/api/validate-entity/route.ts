import { NextResponse } from 'next/server';

import type { EntityKind } from '@/lib/entities/types';
import { validateEntity } from '@/lib/entities/validate';

const KINDS: EntityKind[] = ['email', 'phone', 'place', 'properName'];

function isEntityKind(s: string): s is EntityKind {
  return (KINDS as string[]).includes(s);
}

export async function POST(request: Request) {
  let body: { kind?: string; value?: string; defaultCountry?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const kind = body?.kind;
  const value = body?.value;
  if (typeof kind !== 'string' || !isEntityKind(kind)) {
    return NextResponse.json(
      { error: 'kind must be one of: email, phone, place, properName.' },
      { status: 400 }
    );
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value must be a string.' }, { status: 400 });
  }

  const defaultCountry =
    typeof body.defaultCountry === 'string' && body.defaultCountry.length === 2
      ? (body.defaultCountry.toUpperCase() as import('libphonenumber-js').CountryCode)
      : undefined;

  const result = await validateEntity(kind, value, { defaultCountry });
  return NextResponse.json(result);
}
