export const APP_NAMES = {
  aiocrm: 'AIOCRM',
  ats: 'ATS',
  kudodoc: 'KudoDoc',
  jobplatform: 'JobPlatform',
  web: 'InherentTech',
} as const;

export const PHASE_NAMES = {
  1: 'Foundation & Database Unification',
  2: 'ATS Core (Replace Ceipal)',
  3: 'AIOCRM + Agent Integration',
  4: 'KudoDoc + JobPlatform Integration',
  5: 'XGNMail + SaaS Packaging',
} as const;

export const DEFAULT_NON_BILLABLE_PROJECTS = [
  'Bench', 'Training', 'Internal Meeting', 'Holiday', 'PTO', 'Sick Leave',
] as const;

export const VISA_DISPLAY: Record<string, string> = {
  us_citizen: 'US Citizen',
  green_card: 'Green Card',
  h1b: 'H1-B',
  opt: 'OPT',
  cpt: 'CPT',
  ead: 'EAD',
  tn: 'TN Visa',
  other: 'Other',
};
