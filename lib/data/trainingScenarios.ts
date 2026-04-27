export type TrainingDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface TrainingScenario {
  id: string;
  title: string;
  channel: 'Email' | 'SMS' | 'Social DM' | 'Voice Mail Transcript';
  difficulty: TrainingDifficulty;
  message: string;
  isScam: boolean;
  threatType: string;
  explanation: string;
  coachingTip: string;
}

export const trainingScenarios: TrainingScenario[] = [
  {
    id: 'ts-001',
    title: 'Bank Security Alert',
    channel: 'SMS',
    difficulty: 'Easy',
    message:
      'SCAMSHIELD BANK ALERT: We noticed unusual activity on your account. Verify now to avoid suspension: http://bank-security-check-now.info',
    isScam: true,
    threatType: 'Credential phishing',
    explanation:
      'The message creates panic and pushes an urgent click-through to a suspicious, non-official domain.',
    coachingTip:
      'Never use links from urgent texts. Open your bank app directly or call the number on your card.',
  },
  {
    id: 'ts-002',
    title: 'Package Delivery Fee',
    channel: 'SMS',
    difficulty: 'Easy',
    message:
      'US DELIVERY: Your package is on hold due to missing address data. Pay $2.13 redelivery fee here: https://us-ship-track-pay.com',
    isScam: true,
    threatType: 'Smishing / payment bait',
    explanation:
      'Low-dollar fees are used to lower your guard, then steal card data on fake checkout pages.',
    coachingTip:
      'Track packages through your known carrier account, not links in texts.',
  },
  {
    id: 'ts-003',
    title: 'Coworker Gift Card Request',
    channel: 'Email',
    difficulty: 'Medium',
    message:
      'Hi, I am in a meeting and need you to buy 4 Apple gift cards for a client thank-you. Send photos of the codes ASAP. Keep this confidential.',
    isScam: true,
    threatType: 'Business impersonation',
    explanation:
      'The sender asks for secrecy, urgency, and gift cards, a classic executive impersonation pattern.',
    coachingTip:
      'Verify unusual payment requests via a second channel before taking action.',
  },
  {
    id: 'ts-004',
    title: 'Cloud Sign-In Notice',
    channel: 'Email',
    difficulty: 'Medium',
    message:
      'New sign-in to your cloud account from Chrome on Windows at 9:14 AM. If this was not you, review activity in your account security settings.',
    isScam: false,
    threatType: 'Legitimate account notification',
    explanation:
      'This message is informational, does not pressure immediate payment, and points to account settings rather than a suspicious action link.',
    coachingTip:
      'Legitimate alerts are usually calm and let you verify in-app without threats.',
  },
  {
    id: 'ts-005',
    title: 'Crypto Recovery Agent',
    channel: 'Social DM',
    difficulty: 'Hard',
    message:
      'I work with a blockchain recovery team. We can recover your lost funds, but you must pay a verification gas fee first. I can only hold your slot for 20 minutes.',
    isScam: true,
    threatType: 'Advance fee fraud',
    explanation:
      'Scammers promise recovery and request upfront fees under time pressure. Real recoveries do not require instant private transfer demands.',
    coachingTip:
      'Treat any guaranteed recovery promise plus upfront fee as high risk.',
  },
  {
    id: 'ts-006',
    title: 'University Bursar Follow-Up',
    channel: 'Email',
    difficulty: 'Hard',
    message:
      'Hello Jamie, this is a reminder that your tuition installment is due on May 2. You can pay through the student portal. If you already paid, ignore this notice.',
    isScam: false,
    threatType: 'Legitimate billing reminder',
    explanation:
      'The content is specific, non-threatening, and references a known portal instead of demanding immediate off-platform payment.',
    coachingTip:
      'Even for likely-legit reminders, always navigate from bookmarks or official portals you trust.',
  },
];
