'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Lightbulb,
  Mail,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ScanCtaLink } from '@/components/landing/ScanCtaLink';
import { FadeIn, SlideIn, AnimatedCounter } from '@/components/landing/motion';
import {
  landingStats,
  painPoints,
  howItWorksSteps,
  landingFeatures,
  valueProps,
} from '@/lib/landing/data';
import { LANDING_SECTION_IDS } from '@/lib/landing/constants';
import { scrollToLandingSection } from '@/lib/landing/scroll';

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <Image src="/80210e30-accc-45b8-a1d9-bba6afd57870.png" alt="Digital shield protecting against cyber threats with blue and green data streams" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/85 via-[#0a1628]/75 to-[#0a1628]/95" />
      </div>
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-[#10b981]/40 rounded-full animate-float" />
        <div className="absolute top-[40%] right-[15%] w-3 h-3 bg-[#1a56db]/30 rounded-full animate-float-delay" />
        <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 bg-[#10b981]/50 rounded-full animate-float" />
        <div className="absolute top-[60%] right-[25%] w-2 h-2 bg-[#1a56db]/40 rounded-full animate-float-delay" />
      </div>
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/15">
            <Shield className="w-4 h-4 text-[#10b981]" />
            <span className="text-sm text-white/90 font-medium">Trusted by senior living communities nationwide</span>
          </motion.div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Your Hard-Earned Money<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#34d399]">Isn&apos;t a Public Charity</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/75 leading-relaxed">
            Stop guessing and start verifying with <strong className="text-white">AI-powered fraud detection</strong> that explains every red flag and tells you exactly what to do.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <ScanCtaLink className="h-14 px-8 rounded-xl text-lg bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-[#10b981]/25" />
            <button
              type="button"
              onClick={() => scrollToLandingSection(`#${LANDING_SECTION_IDS.howItWorks}`)}
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl text-lg font-medium bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 transition-colors"
            >
              See How It Works
            </button>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-6 justify-center pt-6">
            {['Free to use', 'No credit card needed', '100% transparent results'].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 className="w-4 h-4 text-[#10b981]" /><span>{t}</span></div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 3 — STATS
   ═══════════════════════════════════════════ */

function StatsSection() {
  return (
    <section className="relative bg-gradient-to-r from-[#0f2b5e] via-[#1a56db] to-[#0f2b5e] py-16 sm:py-20">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          {landingStats.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-2"><Icon className="w-6 h-6 text-[#10b981]" /></div>
                <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                <p className="text-white/70 text-sm font-medium">{s.label}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 4 — PAIN POINTS
   ═══════════════════════════════════════════ */

function PainPointsSection() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium mb-4"><AlertTriangle className="w-4 h-4" />The Growing Threat</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Scams Are <span className="text-[#ef4444]">Getting Smarter</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">AI-powered scams are evolving. Don&apos;t wait until it&apos;s too late to protect what matters most.</p>
          </div>
        </FadeIn>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <SlideIn from="left">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
              <Image src="/eed2ef81-3668-4262-8bbf-d3482972ce6d.png" alt="Smartphone displaying a phishing message with red warning indicators highlighting the fraud attempt" fill className="object-cover rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </SlideIn>
          <div className="space-y-4">
            {painPoints.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-4 p-4 rounded-xl bg-card hover:shadow-md transition-shadow group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors"><Icon className="w-5 h-5 text-red-500" /></div>
                  <p className="text-foreground text-sm sm:text-base leading-relaxed pt-1.5">{p.text}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 5 — HOW IT WORKS
   ═══════════════════════════════════════════ */

function HowItWorksSection() {
  return (
    <section id={LANDING_SECTION_IDS.howItWorks} className="scroll-mt-20 py-20 sm:py-28 bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a56db]/10 text-[#1a56db] rounded-full text-sm font-medium mb-4"><Brain className="w-4 h-4" />Simple & Powerful</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">How <span className="text-[#1a56db]">ScamShield</span> Works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">Three simple steps to verify any suspicious message and protect yourself from fraud.</p>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[72px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-[#1a56db] via-[#7c3aed] to-[#10b981]" />
          {howItWorksSteps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative text-center group">
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow relative z-10" style={{ backgroundColor: `${s.color}15` }}>
                    <Icon className="w-9 h-9" style={{ color: s.color }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold z-20" style={{ backgroundColor: s.color }}>{s.step}</div>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-foreground tracking-tight">{s.title}</h3>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.description}</p>
                {i < howItWorksSteps.length - 1 && <ArrowRight className="hidden md:block absolute top-[60px] -right-4 w-5 h-5 text-muted-foreground/40" />}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 6 — FEATURES
   ═══════════════════════════════════════════ */

function FeaturesSection() {
  return (
    <section id={LANDING_SECTION_IDS.features} className="scroll-mt-20 py-20 sm:py-28 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-sm font-medium mb-4"><Shield className="w-4 h-4" />Powerful Protection</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Everything You Need to <span className="text-[#10b981]">Stay Safe</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">Six powerful AI-driven features working together to protect you from fraud.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingFeatures.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative p-6 rounded-2xl bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${f.iconColor}`} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground tracking-tight">{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            )
          })}
        </div>
        <FadeIn delay={0.3}>
          <div className="mt-16 relative aspect-[16/7] rounded-2xl overflow-hidden shadow-xl">
            <Image src="/45ac2f6d-3712-4076-a40f-881dc1f4550c.png" alt="ScamShield AI analysis dashboard showing text forensics with highlighted suspicious phrases and neural network visualization" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 7 — VALUE PROPOSITIONS
   ═══════════════════════════════════════════ */

function ValuePropsSection() {
  return (
    <section id={LANDING_SECTION_IDS.value} className="scroll-mt-20 py-20 sm:py-28 bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a56db]/10 text-[#1a56db] rounded-full text-sm font-medium mb-4"><Lightbulb className="w-4 h-4" />Why ScamShield</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Transparency You Can <span className="text-[#1a56db]">Trust</span></h2>
          </div>
        </FadeIn>
        <div className="space-y-20">
          {valueProps.map((p, i) => {
            const Icon = p.icon
            const rev = i % 2 === 1
            return (
              <div key={i} className="grid lg:grid-cols-2 gap-12 items-center">
                <SlideIn from={rev ? 'right' : 'left'} className={rev ? 'lg:order-2' : ''}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                    <Image src={p.image} alt={p.imageAlt} fill className="object-cover" />
                  </div>
                </SlideIn>
                <SlideIn from={rev ? 'left' : 'right'} className={rev ? 'lg:order-1' : ''}>
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-sm font-medium"><Icon className="w-4 h-4" />{p.subheadline}</div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{p.headline}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{p.description}</p>
                    <ul className="space-y-3">
                      {p.points.map((pt, j) => (
                        <li key={j} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0" /><span className="text-foreground font-medium">{pt}</span></li>
                      ))}
                    </ul>
                  </div>
                </SlideIn>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 8 — SIGN UP FORM
   ═══════════════════════════════════════════ */

function SignUpFormSection() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', note: '', website: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.email.includes('@')) { toast.error('Please enter a valid email address.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
        toast.success(data?.duplicate ? "You're already on our list — thanks!" : 'Thanks! We will keep you updated.')
      }
      else toast.error(data?.error ?? 'Something went wrong.')
    } catch { toast.error('Connection error. Please try again.') }
    finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <section id={LANDING_SECTION_IDS.signup} className="scroll-mt-20 py-20 sm:py-28 bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-[#10b981]" /></div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">You&apos;re on the list!</h3>
            <p className="text-muted-foreground text-lg">
              Want to scan a suspicious message now?{' '}
              <Link href="/dashboard" className="text-[#1a56db] font-medium hover:underline">
                Open the free scanner
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id={LANDING_SECTION_IDS.signup} className="scroll-mt-20 py-20 sm:py-28 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a56db]/10 text-[#1a56db] rounded-full text-sm font-medium"><Shield className="w-4 h-4" />Stay in the loop</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Get product updates <span className="text-[#10b981]">& tips</span></h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Ready to scan now?{' '}
                <Link href="/dashboard" className="text-[#1a56db] font-medium hover:underline">
                  Try the free scanner
                </Link>{' '}
                — no signup required. Or leave your email for news and fraud alerts.
              </p>
              <div className="space-y-4 pt-2">
                {['Free scanner — no credit card', 'Explainable AI risk scores', 'Optional email updates only'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0" /><span className="text-foreground">{t}</span></div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <form onSubmit={handleSubmit} className="relative bg-card p-8 rounded-2xl shadow-lg border border-border/50 space-y-5">
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                className="absolute opacity-0 pointer-events-none h-0 w-0"
                aria-hidden
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium leading-none">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="firstName" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} className="flex w-full h-10 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium leading-none">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="lastName" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} className="flex w-full h-10 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">Email <span className="text-[#ef4444]">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" name="email" type="email" required placeholder="john@example.com" value={form.email} onChange={handleChange} className="flex w-full h-10 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium leading-none">Message (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea id="note" name="note" placeholder="Tell us how you heard about ScamShield..." value={form.note} onChange={handleChange} className="flex min-h-[100px] w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 h-14 rounded-xl text-lg font-medium bg-[#1a56db] hover:bg-[#1544b5] text-white shadow-lg shadow-[#1a56db]/20 transition-colors disabled:opacity-50 group">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Subscribe for updates <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Email is used only for ScamShield updates. You can use the{' '}
                <Link href="/dashboard" className="underline hover:text-foreground">free scanner</Link> without subscribing.
              </p>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 9 — FINAL CTA
   ═══════════════════════════════════════════ */

function FinalCtaSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2b5e] via-[#1a56db] to-[#0d4a3a]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm"><Shield className="w-8 h-8 text-[#10b981]" /></div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            AI-Powered Scams Are Evolving.<br /><span className="text-[#10b981]">Don&apos;t Wait Until It&apos;s Too Late.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-white/75">Start protecting your loved ones today with ScamShield&apos;s transparent, explainable fraud detection.</p>
          <ScanCtaLink className="h-14 px-10 rounded-xl text-lg bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-[#10b981]/25" />
        </motion.div>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <StatsSection />
      <PainPointsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ValuePropsSection />
      <SignUpFormSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  )
}
