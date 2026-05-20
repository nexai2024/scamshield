import {
  AlertTriangle,
  Brain,
  Eye,
  Heart,
  HelpCircle,
  Highlighter,
  History,
  ImageOff,
  Lightbulb,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Upload,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type LandingStat = {
  value: number;
  label: string;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
};

export const landingStats: LandingStat[] = [
  { value: 1000, suffix: '+', label: 'Families Protected', icon: Users },
  { value: 5, prefix: '< ', suffix: 's', label: 'Instant Analysis', icon: Zap },
  { value: 100, suffix: '%', label: 'Transparent Results', icon: Eye },
];

export const painPoints: { text: string; icon: LucideIcon }[] = [
  { text: 'Inability to distinguish legitimate messages from sophisticated scams', icon: HelpCircle },
  { text: 'AI-powered scams becoming more convincing and harder to detect', icon: Brain },
  { text: 'Lack of transparency in fraud detection tools', icon: ShieldAlert },
  { text: 'Not knowing what action to take with suspicious messages', icon: AlertTriangle },
  { text: 'Vulnerability of seniors and families to fraud attempts', icon: Heart },
  { text: 'No easy way to verify suspicious screenshots', icon: ImageOff },
  { text: 'Feeling helpless against evolving scam tactics', icon: TrendingDown },
];

export const howItWorksSteps = [
  {
    step: 1,
    title: 'Paste or Upload',
    description: 'Copy suspicious text or upload a screenshot of a message you want to verify.',
    icon: Upload,
    color: '#1a56db',
  },
  {
    step: 2,
    title: 'AI Analysis',
    description: 'Our AI engine performs deep text forensics and visual analysis to detect scam patterns.',
    icon: Brain,
    color: '#7c3aed',
  },
  {
    step: 3,
    title: 'Get Your Verdict',
    description: 'Receive an instant risk score, highlighted red flags, and clear next steps to protect yourself.',
    icon: ShieldCheck,
    color: '#10b981',
  },
] as const;

export const landingFeatures = [
  {
    title: 'Deep Text Forensics',
    description: 'Detects linguistic triggers, urgency, and script-like patterns often used by scammers.',
    icon: Search,
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-500',
  },
  {
    title: 'Visual Analysis',
    description: 'Upload screenshots; the system can look for visual inconsistencies that may indicate forgery.',
    icon: ScanLine,
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconColor: 'text-purple-500',
  },
  {
    title: 'Instant Verdicts',
    description: 'Risk score, risk level, scam type hints, and practical next steps — all delivered instantly.',
    icon: Zap,
    gradient: 'from-amber-500/10 to-amber-600/5',
    iconColor: 'text-amber-500',
  },
  {
    title: 'Highlighted Source',
    description: 'Review the original text with emphasis on suspicious segments for clear understanding.',
    icon: Highlighter,
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'Scan History',
    description: 'Review past scans; saving behavior aligns with your plan and local storage for privacy.',
    icon: History,
    gradient: 'from-sky-500/10 to-sky-600/5',
    iconColor: 'text-sky-500',
  },
  {
    title: 'Community Scam Reports',
    description: 'Share anonymized examples stored locally in your browser to learn from patterns.',
    icon: Users,
    gradient: 'from-rose-500/10 to-rose-600/5',
    iconColor: 'text-rose-500',
  },
];

export const valueProps = [
  {
    headline: 'Explainability Over Black Boxes',
    subheadline: 'See the red flags',
    description:
      'We show you exactly which phrases triggered our fraud detection — from payment pressure to impersonation tactics. No guessing, just clear explanations and actionable next steps.',
    icon: Eye,
    image: '/c82ce4fb-4501-4d39-baab-e70426c6d114.png',
    imageAlt:
      'Digital fortress with layered protection shields showing transparent security verification and green checkmarks',
    points: ['See highlighted suspicious phrases', 'Understand scam type classification', 'Clear risk scoring breakdown'],
  },
  {
    headline: 'Actionable Insights That Empower You',
    subheadline: 'Pause and verify',
    description:
      "ScamShield doesn't just give you a number — it shows you exactly why a message is risky and what to do next. Get clear, step-by-step guidance that helps you verify claims safely.",
    icon: Lightbulb,
    image: '/f4082216-f436-4115-a01e-feec18c38c14.png',
    imageAlt:
      'Multi-generational family using digital devices together protected by a translucent blue security shield',
    points: ['Step-by-step action plan', 'Safe verification guidance', 'Report and protect others'],
  },
] as const;
