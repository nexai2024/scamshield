import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import Stripe from 'stripe';

const app = express();
// Stripe webhook needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: '100kb' }));

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function setClerkUserPlan(userId, plan) {
  if (!CLERK_SECRET_KEY || !userId) return;
  try {
    await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_metadata: { plan: plan || null } }),
    });
  } catch (e) {
    console.error('Clerk metadata update failed:', e);
  }
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const RISK_LEVELS = ['Safe', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical'];

function clampScore(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return 10;
  return Math.min(99, Math.max(0, Math.round(num)));
}

function parseJsonFromResponse(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const score = clampScore(parsed.risk_score);
  let level = parsed.risk_level;
  if (!RISK_LEVELS.includes(level)) {
    if (score >= 90) level = 'Critical';
    else if (score >= 75) level = 'High Risk';
    else if (score >= 50) level = 'Medium Risk';
    else if (score >= 20) level = 'Low Risk';
    else level = 'Safe';
  }
  return {
    risk_score: score,
    risk_level: level,
    scam_type: typeof parsed.scam_type === 'string' ? parsed.scam_type : 'N/A',
    red_flags: Array.isArray(parsed.red_flags)
      ? parsed.red_flags.filter((f) => typeof f === 'string')
      : ['No obvious red flags detected.'],
    verdict_summary:
      typeof parsed.verdict_summary === 'string'
        ? parsed.verdict_summary
        : 'Analysis complete. Review the red flags and recommended action.',
    advice:
      typeof parsed.advice === 'string'
        ? parsed.advice
        : 'Proceed with caution. Verify the sender through a known channel before sharing money or personal details.',
    why_risky:
      typeof parsed.why_risky === 'string' ? parsed.why_risky : undefined,
    triggered_phrases: Array.isArray(parsed.triggered_phrases)
      ? parsed.triggered_phrases.filter((p) => typeof p === 'string')
      : undefined,
  };
}

const SYSTEM_PROMPT = `You are a scam and fraud detection expert. Analyze the user's message (e.g. email, text, DM, or dating app message) for signs of fraud, phishing, romance scams, impersonation, or other scams.

Respond with a single JSON object only, no other text. Use this exact structure:
{
  "risk_score": <number 0-100, where 0 is safe and 100 is almost certainly a scam>,
  "risk_level": "<one of: Safe | Low Risk | Medium Risk | High Risk | Critical>",
  "scam_type": "<short label, e.g. Financial Fraud / Phishing, Romance Scam, Impersonation, or N/A if safe>",
  "red_flags": ["list", "of", "specific", "red", "flags", "in", "the", "message"],
  "verdict_summary": "<2-4 sentence plain-language summary of your assessment>",
  "advice": "<1-3 sentences: what the user should do next>",
  "why_risky": "<2-4 sentences explaining why this message was scored as risky, in plain language>",
  "triggered_phrases": ["exact phrases or quotes from the message that contributed to the score"]
}

Rules:
- risk_score must be 0-100. Use the full range: clearly safe messages should be under 20, suspicious 20-50, likely scam 50-75, very likely scam 75+.
- Be specific in red_flags and triggered_phrases; quote or paraphrase the message.
- If the message seems legitimate, say so clearly and set risk_score low; do not over-flag.
- Output only valid JSON. No markdown, no explanation outside the JSON.`;

app.post('/api/analyze', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured. Set it in .env.',
    });
  }

  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing or invalid "text" in request body.' });
  }

  let userContent = text.trim().slice(0, 8000);
  if (text.length > 8000) {
    userContent += '\n\n[Message was truncated for analysis.]';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const content = completion.choices?.[0]?.message?.content;
    const parsed = parseJsonFromResponse(content);
    const result = normalizeResult(parsed);

    if (!result) {
      return res.status(502).json({
        error: 'Could not parse analysis from the model. Please try again.',
      });
    }

    res.json(result);
  } catch (err) {
    console.error('OpenAI API error:', err);
    const status = err?.status === 429 ? 429 : err?.status === 401 ? 401 : 502;
    const message =
      err?.message || 'Analysis failed. Please try again.';
    res.status(status).json({
      error: message,
      code: err?.code,
    });
  }
});

// Create Stripe Checkout session for Pro subscription (requires auth)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!CLERK_SECRET_KEY) {
    return res.status(503).json({ error: 'Auth is not configured.' });
  }
  if (!stripe || !STRIPE_PRICE_ID) {
    return res.status(503).json({ error: 'Billing is not configured.' });
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Sign in required to subscribe.' });
  }
  let userId;
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    userId = payload?.sub;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
  const base = origin.replace(/\/$/, '');
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${base}/dashboard?subscription=success`,
      cancel_url: `${base}/pricing`,
      client_reference_id: userId,
      subscription_data: { metadata: { clerk_user_id: userId } },
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('Stripe checkout error:', e);
    res.status(500).json({ error: e.message || 'Failed to create checkout session.' });
  }
});

// Stripe webhook: update Clerk user plan on subscription lifecycle
app.post('/api/webhooks/stripe', (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook signature verification failed: ${e.message}`);
  }
  (async () => {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (userId) await setClerkUserPlan(userId, 'pro');
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const userId = sub.metadata?.clerk_user_id;
      if (userId) {
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await setClerkUserPlan(userId, isActive ? 'pro' : null);
      }
    }
  })().catch((e) => console.error('Webhook handler error:', e));
  res.sendStatus(200);
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`ScamShield API running at http://localhost:${PORT}`);
  if (!openai) console.warn('Warning: OPENAI_API_KEY not set. Set it in .env to enable analysis.');
  if (!stripe) console.warn('Warning: STRIPE_SECRET_KEY not set. Billing disabled.');
});
