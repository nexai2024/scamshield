import { NextResponse } from 'next/server';
import {
  getApiRateLimitSubject,
  limitAnalyze,
  limitCheckoutSession,
  limitExtractEntities,
  limitInboundEmailWebhook,
  limitLeads,
  limitScanAudit,
  limitValidateEntity,
} from '@/lib/rateLimit/limiters';
import { rateLimitExceededResponse } from '@/lib/rateLimit/response';
import { getClientIp } from '@/lib/rateLimit/clientIp';

export async function guardAnalyzeRateLimit(request: Request): Promise<NextResponse | null> {
  const subject = await getApiRateLimitSubject(request);
  const result = await limitAnalyze(subject);
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardExtractEntitiesRateLimit(request: Request): Promise<NextResponse | null> {
  const subject = await getApiRateLimitSubject(request);
  const result = await limitExtractEntities(subject);
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardValidateEntityRateLimit(request: Request): Promise<NextResponse | null> {
  const subject = await getApiRateLimitSubject(request);
  const result = await limitValidateEntity(subject);
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardCheckoutRateLimit(userId: string): Promise<NextResponse | null> {
  const result = await limitCheckoutSession(userId);
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardInboundEmailRateLimit(request: Request): Promise<NextResponse | null> {
  const result = await limitInboundEmailWebhook(getClientIp(request));
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardScanAuditRateLimit(userId: string): Promise<NextResponse | null> {
  const result = await limitScanAudit(userId);
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}

export async function guardLeadsRateLimit(request: Request): Promise<NextResponse | null> {
  const result = await limitLeads(getClientIp(request));
  if (!result.success) return rateLimitExceededResponse(result);
  return null;
}
