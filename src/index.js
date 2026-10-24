#!/usr/bin/env node

/**
 * andru-intel CLI
 *
 * Revenue intelligence for complex B2B growth.
 * Andru's tools from your terminal.
 *
 * Two tiers:
 *   - No API key (default): instant cold-start ICP from local logic
 *   - With ANDRU_API_KEY: AI-powered deep intelligence via Andru backend
 */

import { readFileSync } from 'node:fs';
import { Command, Option } from 'commander';
import { scoreCommand } from './commands/score.js';
import { personaCommand } from './commands/persona.js';
import { prepCommand } from './commands/prep.js';
import { blueprintCommand } from './commands/blueprint.js';
import { thesisCommand } from './commands/thesis.js';
import { runCommand, ALL_TOOLS } from './commands/run.js';
import { listCommand } from './commands/list.js';
import { assetsCommand, generateCommand, getAssetCommand } from './commands/assets.js';
import { loginCommand, whoamiCommand } from './commands/login.js';

const program = new Command();
// Copy batch 6 J3 (approved by Geter 2026-10-23).
const MAX_PRICE_HELP = 'The most this call may cost, in dollars. Above it, nothing runs.';

program
  .name('andru-intel')
  .description(`Revenue intelligence for complex B2B growth — ${ALL_TOOLS.length} tools from your terminal`)
  .version(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);

program
  .command('score')
  .description('Score a product and generate ICP intelligence')
  .argument('[description]', 'Your product description (quote it; not needed with --ai)')
  .option('-v, --vertical <vertical>', 'Target vertical (e.g., medical, defense, semiconductor)')
  .option('-r, --role <role>', 'Primary buyer role (e.g., CTO, CFO, "VP Sales")')
  .option('--ai', "Show the ICP saved in your Andru account (sign in first: andru-intel login, or set ANDRU_API_KEY)")
  .option('--json', 'Output raw JSON')
  .action(scoreCommand);

program
  .command('persona')
  .description('Get detailed buyer persona intelligence')
  .argument('<role>', 'Buyer role (CTO, CFO, COO, "VP Sales", "VP Engineering")')
  .option('--json', 'Output raw JSON')
  .action(personaCommand);

program
  .command('prep')
  .alias('brief')
  .description('Prepare for a meeting: the pre-meeting brief, then the conversation in Deal Prep (sign in first: andru-intel login, or set ANDRU_API_KEY)')
  .argument('<company>', 'Company you are meeting with')
  .option('-s, --situation <kind>', 'What kind of meeting: discovery, deal or customer_review', 'discovery')
  .option('-r, --room <titles>', 'Who will be there, by title, separated by commas (up to 8)')
  .option('-m, --meeting <sentence>', 'The meeting in a sentence if it isn\'t on your calendar')
  // Removed with the Deal Prep brief (2026-10-24); still accepted so old scripts get a clear line.
  .addOption(new Option('-c, --contact <name>').hideHelp())
  .addOption(new Option('-t, --type <type>').hideHelp())
  .option('--max-price <dollars>', MAX_PRICE_HELP)
  .option('--json', 'Output raw JSON')
  .action(prepCommand);

program
  .command('blueprint')
  .description('First sales hire blueprint — JD, comp, interview questions, ramp plan')
  .option('-s, --stage <stage>', 'Company stage (e.g., "Series A", "Seed")', 'Series A')
  .option('-a, --arr <arr>', 'ARR target (e.g., "$2M", "$5M")', '$2M')
  .option('-d, --deal-size <dealSize>', 'Average deal size')
  .option('-c, --cycle <cycle>', 'Average sales cycle length')
  .option('--team <team>', 'Current team size')
  .option('--json', 'Output raw JSON')
  .action(blueprintCommand);

program
  .command('thesis')
  .description('Match against VC investment theses — top 5 fits with reasoning')
  .argument('<description>', 'Your product description (quote it)')
  .option('-s, --stage <stage>', 'Funding stage (e.g., "Series A", "Seed")', 'Series A')
  .option('-a, --arr <arr>', 'ARR range (e.g., "$1M-$3M")')
  .option('-v, --vertical <vertical>', 'Vertical focus')
  .option('--json', 'Output raw JSON')
  .action(thesisCommand);

program
  .command('run')
  .description('Run any MCP tool directly (andru-intel run <tool> [--param value])')
  .argument('<tool>', 'Tool name (run andru-intel list to see all)')
  .option('--max-price <dollars>', MAX_PRICE_HELP)
  .allowUnknownOption()
  // Commander 13 rejects the values of unknown --param flags as excess arguments, so
  // 'run <tool> --param value' never worked in 1.1.0. The action reads the raw argv itself.
  .allowExcessArguments()
  .action((tool, options, cmd) => {
    // Pass remaining args after tool name for parsing
    const rawArgs = cmd.args.slice(0); // commander puts unknown options here
    // Also get parent args after 'run <tool>'
    const allArgs = process.argv.slice(process.argv.indexOf(tool) + 1);
    runCommand(tool, allArgs);
  });

program
  .command('list')
  .description('Show all available tools and commands')
  .action(listCommand);

// Sign in from the terminal (1.4.0; copy batch 6 K, approved by Geter 2026-10-23).
program
  .command('login')
  .description('Sign in or create an account with your email. Saves an API key on this computer.')
  .argument('[email]')
  .action((email) => loginCommand({ email }));

program
  .command('signup')
  .description('Same as login.')
  .argument('[email]')
  .action((email) => loginCommand({ email }));

program
  .command('whoami')
  .description("Show the account, this key's limits and what it can still spend today.")
  .option('--json', 'Output raw JSON')
  .action(whoamiCommand);



// Asset catalog (1.1.0): 139 deliverables from Andru's catalog, as markdown.
program
  .command('assets')
  .description("Search Andru's asset catalog — 139 deliverables, Tool $3 / Framework $12 / Decision $49 (free to search)")
  .argument('[keywords...]', 'What you need, e.g. board deck, buying committee, first sales hire')
  .option('-g, --group <group>', 'Core, Advanced, Strategic or Buy-side')
  .option('-a, --available', 'Only assets you can generate today')
  .option('-l, --limit <n>', 'Maximum results', '20')
  .option('--json', 'Output raw JSON')
  .action(assetsCommand);

program
  .command('generate')
  .description('Generate an asset at its catalog price and save it as markdown (sign in first: andru-intel login, or set ANDRU_API_KEY)')
  .argument('<asset>', 'Asset name from `andru-intel assets` (quote it)')
  .option('-o, --out <file>', 'Where to save the markdown (default: ./<asset-name>.md)')
  .option('--no-wait', 'Start it and print the job id instead of waiting')
  .option('--max-price <dollars>', MAX_PRICE_HELP)
  .action(generateCommand);

program
  .command('get-asset')
  .description('Collect a generated asset as markdown')
  .argument('<jobId>', 'Job id printed by `andru-intel generate --no-wait`')
  .option('-o, --out <file>', 'Where to save the markdown')
  .action(getAssetCommand);

program.parse();
