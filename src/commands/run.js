/**
 * run command — generic MCP tool executor
 *
 * andru-intel run get_competitive_positioning --companyName "Acme Corp"
 * andru-intel run classify_opportunity --companyName "Acme" --industry SaaS
 * andru-intel run batch_fit_score --companies '["Acme","Beta"]'
 *
 * Requires ANDRU_API_KEY.
 */

import { formatJSON } from '../formatters/json.js';

// The 30 tools the Andru backend and the MCP server (1.9.0) serve (Geter, 2026-10-08). The CRM
// tools (get_syndication_status, trigger_syndication, sync_crm_deals) are held back until CRM sync
// is ready; the backend refuses them.
const ALL_TOOLS = [
  'get_icp_fit_score', 'get_persona_profile', 'get_disqualification_signals',
  'get_messaging_framework', 'get_competitive_positioning', 'classify_opportunity',
  'get_account_plan', 'get_capability_profile', 'get_evaluation_criteria',
  'get_icp_profile', 'discover_prospects', 'get_pre_brief',
  'batch_fit_score', 'get_sales_blueprint', 'get_thesis_match',
  'get_founder_wellness', 'simulate_buyer_persona',
  'get_revenue_memory', 'log_revenue_insight', 'get_founder_context', 'get_memory_history',
  'get_market_signals', 'assess_company_readiness', 'get_portfolio_readiness_rollup',
  'generate_portfolio_brief', 'consult_agent',
  'list_assets', 'generate_asset', 'get_asset', 'set_product_context',
];

export { ALL_TOOLS };

export async function runCommand(toolName, args) {
  if (!toolName) {
    console.error('Specify a tool name: andru-intel run <tool-name> [--param value]');
    console.error(`Run 'andru-intel list' to see available tools.`);
    process.exit(1);
  }

  if (!ALL_TOOLS.includes(toolName)) {
    console.error(`Unknown tool: ${toolName}`);
    console.error(`Run 'andru-intel list' to see available tools.`);
    process.exit(1);
  }

  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  // Parse remaining args as --key value pairs
  const toolArgs = parseToolArgs(args);

  const { default: ora } = await import('ora');
  const spinner = ora(`Running ${toolName}...`).start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);
    const result = await client.callTool(toolName, toolArgs);

    spinner.stop();

    const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
    try {
      const parsed = JSON.parse(content);
      console.log(formatJSON(parsed));
    } catch {
      console.log(content);
    }
  } catch (error) {
    spinner.fail(`${toolName} failed: ${error.message}`);
    process.exit(1);
  }
}

function parseToolArgs(argv) {
  const args = {};
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        try {
          args[key] = JSON.parse(next);
        } catch {
          args[key] = next;
        }
        i += 2;
      } else {
        args[key] = true;
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return args;
}
