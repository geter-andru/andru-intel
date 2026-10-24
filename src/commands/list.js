/**
 * list command — show all available tools and commands
 *
 * andru-intel list
 */

import chalk from 'chalk';
import { ALL_TOOLS } from './run.js';

export const TOOL_DESCRIPTIONS = {
  get_icp_fit_score: 'Score a company against your ICP',
  get_persona_profile: 'A starting picture of one buyer, to confirm with them',
  get_disqualification_signals: 'Whether a buyer is ready, and who fits them better today',
  get_messaging_framework: 'Your story in one buyer\'s terms',
  get_competitive_positioning: 'The buyer\'s alternatives, weighed for the buyer',
  classify_opportunity: 'One read on whether a buyer is ready',
  get_account_plan: 'A plan for one target account: committee, likely champion, next steps',
  get_evaluation_criteria: 'What the buyer said they need, against what you offer',
  get_icp_profile: 'Your ICP: who decides, what each needs, who isn\'t a fit',
  discover_prospects: 'Companies with a reason to change now, with sources',
  get_pre_brief: 'What each person in the room likely thinks going in',
  batch_fit_score: 'Batch score multiple companies (max 50)',
  get_sales_blueprint: 'First sales hire blueprint',
  get_thesis_match: 'Match against VC investment theses',
  simulate_buyer_persona: 'Prepare for a meeting: Andru asks the questions your real buyers ask',
  get_revenue_memory: 'What Andru has learned about your business over time',
  log_revenue_insight: 'Save an insight, decision, metric or pattern to memory',
  get_founder_context: 'Everything Andru knows about you, by memory type',
  get_memory_history: 'How a metric or priority changed over time',
  get_market_signals: 'Ranked market signals with buyer impact',
  assess_company_readiness: 'Revenue Readiness Index (0-100) for a company',
  get_portfolio_readiness_rollup: 'Readiness scorecard across a portfolio',
  generate_portfolio_brief: 'Board/LP-grade portfolio brief',
  consult_agent: "Ask one of Andru's domain expert agents ($3 per turn)",
  list_assets: "Search Andru's catalog of 139 assets (free)",
  generate_asset: 'Generate a catalog asset at its catalog price',
  get_asset: 'Collect a generated asset as markdown',
  set_product_context: 'Tell Andru what you sell, once (website or description)',
};

export function listCommand() {
  console.log('');
  console.log(chalk.hex('#3B82F6').bold(`  ANDRU INTELLIGENCE — ${ALL_TOOLS.length} Tools`));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log('');

  console.log(chalk.bold('  Named Commands') + chalk.gray(' (rich output)'));
  console.log('    score <description>      ICP scoring + stakeholder understanding');
  console.log('    persona <role>           Buyer persona deep dive');
  console.log('    prep <company>           Pre-meeting brief, then the conversation in Deal Prep (alias: brief)');
  console.log('    blueprint                First sales hire blueprint');
  console.log('    thesis <description>     VC thesis matching');
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
  console.log(chalk.gray('  Usage: andru-intel run get_competitive_positioning --companyName "<company>"'));
  console.log(chalk.gray('  Docs:  https://andru-ai.com'));
  console.log('');
}
