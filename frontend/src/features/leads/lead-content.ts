export type LeadCompanyFacts = {
  industry: string;
  employees: string;
  serviceArea: string;
  businessType: string;
};

const EMPTY_FACTS: LeadCompanyFacts = {
  industry: '',
  employees: '',
  serviceArea: '',
  businessType: '',
};

/** Demo company facts keyed by seeded lead id (insert order in database.seed). */
const SEED_FACTS: Record<number, LeadCompanyFacts> = {
  1: {
    industry: 'Plumbing / Home Services',
    employees: '10 – 50',
    serviceArea: 'Lyon & surrounding area',
    businessType: 'Local service business',
  },
  2: {
    industry: 'Construction',
    employees: '20 – 80',
    serviceArea: 'Lyon',
    businessType: 'Local service business',
  },
  3: {
    industry: 'Construction',
    employees: '5 – 20',
    serviceArea: 'Lyon',
    businessType: 'Local service business',
  },
  4: {
    industry: 'Roofing',
    employees: '5 – 15',
    serviceArea: 'Lyon',
    businessType: 'Local service business',
  },
  5: {
    industry: 'Renovation',
    employees: '5 – 25',
    serviceArea: 'Lyon',
    businessType: 'Local service business',
  },
};

export function leadCompanyFacts(id: number): LeadCompanyFacts {
  return SEED_FACTS[id] ?? EMPTY_FACTS;
}

export function enrichLeadContent<T extends { id: number }>(lead: T): T & LeadCompanyFacts {
  return { ...lead, ...leadCompanyFacts(lead.id) };
}
