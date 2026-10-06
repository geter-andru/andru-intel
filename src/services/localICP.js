/**
 * Local ICP Service
 *
 * Embedded cold-start ICP logic — pure JS, no AI, no network.
 * Adapted from backend/src/mcp/coldStartICPService.js
 */

// Pre-built buyer personas
const BUYER_PERSONAS = {
  CFO: {
    title: 'Chief Financial Officer',
    firstName: 'Janet',
    demographics: { typicalAge: '45-55', background: 'Finance, Accounting, MBA' },
    authority: { budgetControl: 'high', decisionPower: 'economic_buyer', influence: 'final_approval' },
    dayInTheLife: 'Reviews P&L before 7 AM. Challenges every line item. Needs ROI in months, not years.',
    successMetrics: ['Payback period under 12 months', 'Cost reduction measurable within 90 days', 'Budget variance under 5%'],
    concerns: ['Total cost of ownership', 'Implementation costs', 'Payback period', 'Budget approval process'],
    typicalQuestions: [
      'What is the total cost of ownership over 3 years?',
      'How long until we see ROI?',
      'What happens to our investment if this doesn\'t work?',
      'How does this compare cost-wise to building in-house?',
    ],
  },
  CTO: {
    title: 'Chief Technology Officer',
    firstName: 'Marcus',
    demographics: { typicalAge: '35-50', background: 'Engineering, Computer Science, PhD' },
    authority: { budgetControl: 'medium', decisionPower: 'technical_buyer', influence: 'technical_veto' },
    dayInTheLife: 'First check: system alerts. Then architecture reviews. Skeptical of vendors who can\'t explain their stack.',
    successMetrics: ['Integration under 2 sprints', 'Zero security incidents', '99.9% uptime SLA'],
    concerns: ['Technical debt', 'Integration complexity', 'Security compliance', 'Engineering resources required'],
    typicalQuestions: [
      'How does this integrate with our existing stack?',
      'What happens at 10x our current scale?',
      'Walk me through your security model.',
      'What is the migration path if we want to switch later?',
    ],
  },
  COO: {
    title: 'Chief Operating Officer',
    firstName: 'Diana',
    demographics: { typicalAge: '40-55', background: 'Operations, MBA, Process Engineering' },
    authority: { budgetControl: 'medium', decisionPower: 'operational_buyer', influence: 'process_approval' },
    dayInTheLife: 'Thinks in workflows and bottlenecks. Measures everything in team hours saved.',
    successMetrics: ['Team adoption over 80% in 60 days', 'Process cycle time reduction', 'Operational cost savings'],
    concerns: ['Change management', 'Training requirements', 'Process disruption', 'Operational metrics'],
    typicalQuestions: [
      'How long does onboarding take for our team?',
      'What does the transition period look like?',
      'How do you measure operational impact?',
      'What support do you provide during rollout?',
    ],
  },
  'VP Sales': {
    title: 'VP of Sales',
    firstName: 'Rob',
    demographics: { typicalAge: '38-50', background: 'Sales Leadership, Revenue Operations' },
    authority: { budgetControl: 'low', decisionPower: 'user_buyer', influence: 'champion_or_blocker' },
    dayInTheLife: 'Lives in pipeline dashboards. Judges everything by pipeline velocity and win rate.',
    successMetrics: ['Pipeline velocity increase', 'Win rate improvement', 'Ramp time reduction for new reps'],
    concerns: ['Time to value', 'Sales team adoption', 'Competitive differentiation', 'Customer success stories'],
    typicalQuestions: [
      'Can you show me a customer who looks like us?',
      'How quickly will this impact our pipeline?',
      'What is your competitive win rate?',
      'How does your onboarding work for sales teams?',
    ],
  },
  'VP Engineering': {
    title: 'VP of Engineering',
    firstName: 'Priya',
    demographics: { typicalAge: '35-48', background: 'Software Engineering, Technical Leadership' },
    authority: { budgetControl: 'low', decisionPower: 'technical_evaluator', influence: 'technical_recommendation' },
    dayInTheLife: 'Protects engineering time fiercely. Values documentation over demos.',
    successMetrics: ['API reliability', 'Documentation completeness', 'Integration engineering hours'],
    concerns: ['API quality', 'Documentation completeness', 'Support responsiveness', 'Technical roadmap'],
    typicalQuestions: [
      'How good is your API documentation?',
      'What is your average support response time?',
      'What is on your technical roadmap for the next 6 months?',
      'How much engineering time does integration require?',
    ],
  },
};

// Vertical matching
function matchVertical(vertical) {
  if (!vertical) return null;
  const v = vertical.toLowerCase();
  if (/defense|aerospace|military|dod|itar|mil-std/.test(v)) return 'defense_aerospace';
  if (/medical|health|pharma|biotech|fda|clinical|hospital/.test(v)) return 'medical';
  if (/semiconductor|chip|fab|datacenter|data center|wafer/.test(v)) return 'semiconductor_datacenter';
  return null;
}

// Role matching
function matchPersonaKey(targetRole) {
  if (!targetRole) return 'CTO';
  const r = targetRole.toLowerCase();
  if (/cfo|chief financial|finance/.test(r)) return 'CFO';
  if (/cto|chief technology|chief tech/.test(r)) return 'CTO';
  if (/coo|chief operating|operations/.test(r)) return 'COO';
  if (/vp.*(sale|revenue)|head.*(sale|revenue)/.test(r)) return 'VP Sales';
  if (/vp.*(eng|develop)|head.*(eng|develop)/.test(r)) return 'VP Engineering';
  if (/engineer|technical|developer/.test(r)) return 'CTO';
  if (/financial|accounting|budget/.test(r)) return 'CFO';
  if (/sales|revenue|pipeline/.test(r)) return 'VP Sales';
  if (/operation|process/.test(r)) return 'COO';
  return 'CTO';
}

// Extract pain triggers from description
function extractPainTriggers(description) {
  if (!description) return [];
  const triggers = [];
  const d = description.toLowerCase();
  if (/compliance|regulat|audit/.test(d)) triggers.push('Regulatory compliance burden');
  if (/automat|efficien|productiv/.test(d)) triggers.push('Manual process bottlenecks');
  if (/security|protect|threat/.test(d)) triggers.push('Security risk exposure');
  if (/scale|grow|expand/.test(d)) triggers.push('Scaling challenges');
  if (/cost|expens|budget/.test(d)) triggers.push('Cost management pressure');
  if (/sales|revenue|pipeline/.test(d)) triggers.push('Revenue growth stall');
  if (/data|analy|insight/.test(d)) triggers.push('Lack of actionable data');
  if (/integrat|connect|unif/.test(d)) triggers.push('System fragmentation');
  if (/ai|machine learn|intellig/.test(d)) triggers.push('AI adoption gap');
  if (/customer|retain|churn/.test(d)) triggers.push('Customer retention challenges');
  if (triggers.length < 3) {
    const fallbacks = ['Time spent on manual processes', 'Difficulty measuring ROI', 'Lack of systematic approach'];
    for (const fb of fallbacks) {
      if (triggers.length >= 3) break;
      if (!triggers.includes(fb)) triggers.push(fb);
    }
  }
  return triggers;
}

/**
 * Build a cold-start ICP from product description.
 * @param {{ description: string, vertical?: string, role?: string }} params
 */
export function buildLocalICP({ description, vertical, role }) {
  const segmentKey = matchVertical(vertical);
  const primaryPersonaKey = matchPersonaKey(role);
  const primaryPersona = BUYER_PERSONAS[primaryPersonaKey];
  const painTriggers = extractPainTriggers(description);

  // Select 2 most relevant personas
  const personaKeys = [primaryPersonaKey];
  const secondaryKeys = Object.keys(BUYER_PERSONAS).filter(k => k !== primaryPersonaKey);
  personaKeys.push(secondaryKeys[0]); // Add first non-primary

  const personas = personaKeys.map(key => {
    const p = BUYER_PERSONAS[key];
    return {
      title: p.title,
      name: p.firstName,
      role: p.authority.decisionPower.replace('_', ' '),
      dayInTheLife: p.dayInTheLife,
      successMetrics: p.successMetrics,
      concerns: p.concerns,
      topQuestion: p.typicalQuestions[0],
    };
  });

  return {
    product: description,
    vertical: vertical || 'B2B SaaS',
    segment: segmentKey,
    painTriggers,
    personas,
    buyingCommittee: Object.entries(BUYER_PERSONAS).map(([key, p]) => ({
      role: p.authority.decisionPower.replace('_', ' '),
      title: p.title,
      name: p.firstName,
    })),
    source: 'cold_start',
  };
}

/**
 * Get a single persona by role key.
 */
export function getPersona(roleKey) {
  const key = matchPersonaKey(roleKey);
  const p = BUYER_PERSONAS[key];
  if (!p) return null;
  return {
    key,
    ...p,
  };
}

/**
 * List all available persona keys.
 */
export function listPersonaKeys() {
  return Object.keys(BUYER_PERSONAS);
}
