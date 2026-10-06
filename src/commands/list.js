/**
 * list command — show all available tools and commands
 *
 * andru-intel list
 */

import chalk from 'chalk';
import { ALL_TOOLS } from './run.js';

const TOOL_DESCRIPTIONS = {
  get_icp_fit_score: 'Score a company against your ICP',
  get_persona_profile: 'Buyer persona intelligence lookup',
  get_disqualification_signals: 'Disqualification and anti-pattern detection',
  get_messaging_framework: 'MBTI-adapted messaging framework',
  get_competitive_positioning: 'Competitive positioning and battlecards',
  classify_opportunity: 'Full opportunity classification',
  get_account_plan: 'Structured account plan with MEDDICC',
  get_capability_profile: 'Machine-readable capability profile',
  get_evaluation_criteria: '6-value alignment scoring',
  get_icp_profile: 'Full ICP profile (all 5 intelligence layers)',
  discover_prospects: 'AI-powered prospect discovery',
  get_pre_brief: 'Pre-meeting brief with talk track',
  get_syndication_status: 'CRM syndication status and drift',
  trigger_syndication: 'Trigger ICP syndication to CRMs',
  batch_fit_score: 'Batch score multiple companies (max 50)',
  get_sales_blueprint: 'First sales hire blueprint',
  get_thesis_match: 'Match against VC investment theses',
  get_founder_wellness: 'Burnout risk assessment',
  simulate_buyer_persona: 'Simulate buyer persona conversation',
};

export function listCommand() {
  console.log('');
  console.log(chalk.hex('#3B82F6').bold('  ANDRU INTELLIGENCE — 19 Tools'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log('');

  console.log(chalk.bold('  Named Commands') + chalk.gray(' (rich output)'));
  console.log('    score <description>      ICP scoring + stakeholder understanding');
  console.log('    persona <role>           Buyer persona deep dive');
  console.log('    brief <company>          Pre-meeting intelligence brief');
  console.log('    blueprint                First sales hire blueprint');
  console.log('    thesis <description>     VC thesis matching');
  console.log('    wellness                 Founder burnout check');
  console.log('    roleplay <persona>       Buyer persona simulation');
  console.log('');

  console.log(chalk.bold('  All Tools') + chalk.gray(' (via andru-intel run <tool> [--args])'));
  console.log('');

  const maxName = Math.max(...ALL_TOOLS.map(t => t.length));
  for (const tool of ALL_TOOLS) {
    const name = tool.padEnd(maxName + 2);
    const desc = TOOL_DESCRIPTIONS[tool] || '';
    console.log(`    ${name}${chalk.gray(desc)}`);
  }

  console.log('');
  console.log(chalk.gray('  Usage: andru-intel run get_competitive_positioning --companyName "Acme"'));
  console.log(chalk.gray('  Docs:  https://andru-ai.com'));
  console.log('');
}
