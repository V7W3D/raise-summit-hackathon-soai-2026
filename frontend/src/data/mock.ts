export type Priority = 'High' | 'Medium' | 'Low';

export const nextBestActions: Array<{
  icon: 'leads' | 'draft' | 'reply' | 'clock' | 'refresh';
  priority: Priority;
  title: string;
  subtitle?: string;
}> = [
  {
    icon: 'leads',
    priority: 'High',
    title: 'Review 8 new leads',
    subtitle: 'From your Construction Clients – Lyon mission',
  },
  { icon: 'draft', priority: 'High', title: 'Approve 3 outreach drafts' },
  { icon: 'reply', priority: 'Medium', title: 'Reply to 2 interested prospects' },
  { icon: 'clock', priority: 'Medium', title: 'Follow up with 5 silent leads' },
  { icon: 'refresh', priority: 'Low', title: 'Update status for 1 ongoing negotiation' },
];

export const homeStats = [
  { icon: 'missions', label: 'Missions active', value: '3' },
  { icon: 'search', label: 'New leads found this week', value: '42' },
  { icon: 'user', label: 'Qualified leads', value: '17' },
  { icon: 'send', label: 'Outreach sent', value: '9' },
  { icon: 'smile', label: 'Positive replies', value: '3' },
  { icon: 'calendar', label: 'Meetings booked', value: '1' },
] as const;

export const opportunityFeed = [
  {
    dot: '#2563eb',
    icon: 'building',
    text: 'New matching business detected: Atlantic Fish Pro may fit your sourcing mission',
    time: '2m ago',
  },
  { dot: '#16a34a', icon: 'reply', text: 'A lead changed status: BTP Rhône replied positively', time: '15m ago' },
  { dot: '#ea8a1f', icon: 'warning', text: 'Potential duplicate found', time: '1h ago' },
  { dot: '#dc2626', icon: 'globe', text: 'Website of a tracked prospect is no longer active', time: '2h ago' },
  { dot: '#2563eb', icon: 'star', text: 'New high-fit company detected in your target niche', time: '3h ago' },
] as const;

export const recentMissions = [
  { name: 'Construction Leads – Lyon', updated: 'Updated 1h ago', progress: 65 },
  { name: 'Investors for Food Startup', updated: 'Updated 2h ago', progress: 40 },
  { name: 'New Suppliers for Sushi Business', updated: 'Updated 5h ago', progress: 25 },
] as const;

export const recentProspects = [
  { initials: 'AF', color: '#2563eb', name: 'Atlantic Fish Pro', meta: 'Seafood Supplier • Brest, France', fit: 'High fit', fitTone: 'green', time: '2m ago' },
  { initials: 'BR', color: '#0ea5e9', name: 'BTP Rhône', meta: 'Construction • Lyon, France', fit: 'High fit', fitTone: 'green', time: '15m ago' },
  { initials: 'GV', color: '#7c5cf0', name: 'GreenBite Ventures', meta: 'Venture Capital • Paris, France', fit: 'Medium fit', fitTone: 'orange', time: '1h ago' },
  { initials: 'SW', color: '#f43f5e', name: 'Sushi World Supplies', meta: 'Food Supplier • Marseille, France', fit: 'Medium fit', fitTone: 'orange', time: '2h ago' },
  { initials: 'ES', color: '#16a34a', name: 'EcoBuild Solutions', meta: 'Construction • Grenoble, France', fit: 'Low fit', fitTone: 'blue', time: '3h ago' },
] as const;

/* ---------- Missions ---------- */
export const missions = [
  {
    name: 'Construction Clients – Lyon',
    target: 'Target: small service businesses',
    location: 'Lyon, France',
    progress: 36,
    status: 'Active',
    statusTone: 'green',
    lastActivity: '1h ago',
  },
  {
    name: 'Seafood Suppliers – Paris',
    target: 'Target: premium seafood suppliers',
    location: 'Paris, France',
    progress: 33,
    status: 'Active',
    statusTone: 'green',
    lastActivity: '3h ago',
  },
  {
    name: 'Accounting Consultants – Bakery Network',
    target: 'Target: small business accounting advisors',
    location: 'France',
    progress: 22,
    status: 'Draft',
    statusTone: 'neutral',
    lastActivity: 'Yesterday',
  },
  {
    name: 'Strategic Partners – E-commerce',
    target: 'Target: logistics & payment partners',
    location: 'France & Europe',
    progress: 46,
    status: 'Active',
    statusTone: 'green',
    lastActivity: '5h ago',
  },
  {
    name: 'Investors – Food Tech Startups',
    target: 'Target: early-stage impact investors',
    location: 'Europe',
    progress: 20,
    status: 'Paused',
    statusTone: 'orange',
    lastActivity: '2d ago',
  },
] as const;

/* ---------- Discover ---------- */
export type Lead = {
  id: string;
  initials: string;
  logoColor: string;
  name: string;
  description: string;
  location: string;
  website: string;
  contactBadge: string;
  score: number;
  scoreLabel: string;
  scoreTone: 'green' | 'blue' | 'orange';
  why: string[];
  missing: string[];
  recommended: string[];
};

export const discoverLeads: Lead[] = [
  {
    id: 'rhone-plomberie',
    initials: 'RP',
    logoColor: '#475569',
    name: 'Rhône Plomberie',
    description: 'Local emergency plumbing and repair company',
    location: 'Lyon, France',
    website: 'rhoneplomberie.fr',
    contactBadge: 'Generic email + phone found',
    score: 84,
    scoreLabel: 'High fit',
    scoreTone: 'green',
    why: ['Local plumbing company in Lyon', 'Emergency service mentioned', 'Strong phone-first workflow', 'Active website'],
    missing: ['No named operations manager'],
    recommended: ['Short email + phone follow-up'],
  },
  {
    id: 'btp-rhone',
    initials: 'BT',
    logoColor: '#0ea5e9',
    name: 'BTP Rhône Services',
    description: 'General construction & renovation services',
    location: 'Lyon, France',
    website: 'btprhone.fr',
    contactBadge: 'Email + phone found',
    score: 72,
    scoreLabel: 'High fit',
    scoreTone: 'green',
    why: ['Emergency & maintenance', '20+ years in business', 'Local team in Lyon'],
    missing: ['No pricing on website'],
    recommended: ['Intro email with case study'],
  },
  {
    id: 'ecobuild-lyon',
    initials: 'EL',
    logoColor: '#16a34a',
    name: 'EcoBuild Lyon',
    description: 'Sustainable construction & eco-renovation',
    location: 'Lyon, France',
    website: 'ecobuild-lyon.fr',
    contactBadge: 'Contact form found',
    score: 66,
    scoreLabel: 'Needs review',
    scoreTone: 'orange',
    why: ['Eco-focused positioning', 'Residential & small projects', 'Active blog & news'],
    missing: ['No direct phone number', 'Team page limited'],
    recommended: ['Verify phone & response time'],
  },
  {
    id: 'artisan-toiture',
    initials: 'AT',
    logoColor: '#6366f1',
    name: 'Artisan Toiture Plus',
    description: 'Roofing & roof repair specialists',
    location: 'Lyon, France',
    website: 'toitureplus.fr',
    contactBadge: 'Phone found',
    score: 61,
    scoreLabel: 'Needs review',
    scoreTone: 'orange',
    why: ['Roofing specialists', '10+ years experience', 'Local service area'],
    missing: ['No email found'],
    recommended: ['Find email & owner contact'],
  },
  {
    id: 'maison-renov',
    initials: 'MR',
    logoColor: '#f43f5e',
    name: 'Maison Rénov Experts',
    description: 'Renovation & home improvement',
    location: 'Lyon, France',
    website: 'maisonrenov-experts.fr',
    contactBadge: 'Email + phone found',
    score: 59,
    scoreLabel: 'Promising',
    scoreTone: 'orange',
    why: ['Full renovation services', 'Positive customer reviews', 'Active social presence'],
    missing: ['Website outdated'],
    recommended: ['Re-verify activity & lead gen fit'],
  },
];

export const evidenceSnippets = [
  {
    quote: 'Intervention d’urgence 24h/24 et 7j/7 pour tous vos problèmes de plomberie à Lyon et ses environs.',
    source: 'Homepage',
  },
  {
    quote: 'Plombier à Lyon — dépannage rapide, installation, fuite d’eau, débouchage, chauffe-eau…',
    source: 'Homepage',
  },
  {
    quote: 'Appelez-nous au 04 78 123 456 pour une intervention rapide. Devis gratuit.',
    source: 'Contact page',
  },
] as const;

export const evidenceTimeline = [
  { label: 'Homepage scanned', time: '2 min ago' },
  { label: 'About page scanned', time: '3 min ago' },
  { label: 'Services page scanned', time: '3 min ago' },
  { label: 'Contact page scanned', time: '2 min ago' },
] as const;

/* ---------- Insights ---------- */
export const missionPerformance = [
  { icon: 'user', label: 'Leads found', value: '1,247', delta: '+18% vs May 16–22', deltaTone: 'green' },
  { icon: 'check', label: 'Qualified leads', value: '612', delta: '49% of leads', deltaTone: 'muted' },
  { icon: 'send', label: 'Messages sent', value: '486', delta: '+22% vs May 16–22', deltaTone: 'green' },
  { icon: 'reply', label: 'Reply rate', value: '18.7%', delta: '+3.1pp vs May 16–22', deltaTone: 'green' },
  { icon: 'star', label: 'Positive reply rate', value: '6.2%', delta: '+1.4pp vs May 16–22', deltaTone: 'green' },
  { icon: 'calendar', label: 'Meetings booked', value: '26', delta: '+2 vs May 16–22', deltaTone: 'green' },
  { icon: 'target', label: 'Conversion rate', value: '4.2%', delta: '+0.6pp vs May 16–22', deltaTone: 'green' },
] as const;

export const funnelStages = [
  { label: 'Results found', value: '1,247', pct: '100%' },
  { label: 'Qualified', value: '612', pct: '49%' },
  { label: 'Contactable', value: '486', pct: '38.9%' },
  { label: 'Outreach sent', value: '486', pct: '38.9%' },
  { label: 'Replied', value: '91', pct: '18.7%' },
  { label: 'Meeting booked', value: '26', pct: '4.2%' },
] as const;

export const funnelDrops = [
  { delta: '-51%', tone: 'red', note: 'Too many irrelevant search results.' },
  { delta: '-22%', tone: 'red', note: 'Missing contact info or email.' },
  { delta: '0%', tone: 'green', note: 'Good reach rate. Keep it up.' },
  { delta: '-81%', tone: 'red', note: 'Weak reply rate. Improve messaging.' },
  { delta: '-71%', tone: 'red', note: 'Good replies but no conversion.' },
] as const;

export const weeklyChanges = [
  { icon: 'trend', tone: 'green', title: 'Reply rate improved', text: 'Reply rate increased by 3.1pp, likely due to shorter emails and better fit.' },
  { icon: 'building', tone: 'blue', title: 'More local businesses', text: 'You contacted more local companies, which tend to respond better.' },
  { icon: 'calendar', tone: 'orange', title: 'Meetings up', text: '2 more meetings booked compared to last week.' },
] as const;

export const bestPatterns = [
  { rank: 1, icon: 'user', title: 'Companies with active websites reply more', text: 'Reply rate is 23% higher when a website is active.', level: 'High' },
  { rank: 2, icon: 'pin', title: 'Local businesses respond better than remote ones', text: 'Local companies have a 34% higher positive reply rate.', level: 'High' },
  { rank: 3, icon: 'mail', title: 'Short, direct emails outperform long ones', text: 'Emails under 90 words get 28% more replies.', level: 'Medium' },
  { rank: 4, icon: 'phone', title: 'Phone-first businesses are a stronger fit', text: 'Phone-first companies are 1.6x more likely to reply.', level: 'Medium' },
] as const;

export const sourceQuality = [
  { icon: 'google', name: 'Google', qualified: 52, reply: 19.6, starred: false },
  { icon: 'directory', name: 'Directory', qualified: 46, reply: 16.1, starred: false },
  { icon: 'referral', name: 'Referral', qualified: 61, reply: 24.3, starred: true },
  { icon: 'feed', name: 'New-subscriber feed', qualified: 37, reply: 11.2, starred: false },
] as const;

export const recommendations = [
  { icon: 'target', title: 'Narrow your mission', text: 'Focus on concrete & general construction in Lyon.' },
  { icon: 'users', title: 'Target smaller companies', text: 'Businesses with 2–20 employees reply more.' },
  { icon: 'phone', title: 'Focus on businesses with visible phone flow', text: 'They are 1.6x more likely to respond.' },
  { icon: 'mail', title: 'Try shorter outreach', text: 'Keep emails under 90 words for better results.' },
] as const;
