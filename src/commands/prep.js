/**
 * prep command (1.3.0)
 *
 * andru-intel prep "Acme Corp" --contact "Jane Doe" --type discovery
 * andru-intel brief "Acme Corp"          (same command, the name it had before)
 *
 * Writes the pre-meeting brief, then points to Deal Prep on the platform for the conversation itself
 * (the buyers played by Andru): a back-and-forth the terminal can't hold well, and Deal Prep keeps
 * the meeting's context (Geter, 2026-10-22). Requires ANDRU_API_KEY.
 */

import { formatJSON } from '../formatters/json.js';
import chalk from 'chalk';
import { requireApiKey } from '../services/credentials.js';
import { withMaxPrice } from '../services/maxPrice.js';

const PLATFORM = 'https://platform.andru-ai.com';

/** Where to prepare the conversation: the meeting itself when Andru matched one on the calendar, else Deal Prep. */
export function prepareUrl(parsed) {
  const eventId = parsed?.meeting?.eventId || parsed?.meeting?.id || parsed?.eventId;
  return eventId ? `${PLATFORM}/deal-prep?meeting=${encodeURIComponent(eventId)}` : `${PLATFORM}/deal-prep`;
}

export async function prepCommand(company, options) {
  const apiKey = requireApiKey();

  const { default: ora } = await import('ora');
  const spinner = ora(`Preparing your ${options.type} meeting with ${company}...`).start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(apiKey);

    const result = await client.callTool('get_pre_brief', withMaxPrice({
      companyName: company,
      briefType: options.type,
      ...(options.contact ? { contactName: options.contact } : {}),
    }, options.maxPrice));

    spinner.stop();

    const text = result?.content?.[0]?.text;
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : result; } catch { /* plain text */ }

    if (options.json) {
      console.log(formatJSON(result));
      return;
    }

    // The brief as markdown; older response shapes fall back to the MCP text or the raw JSON.
    const content = parsed?.brief?.raw || text || JSON.stringify(result, null, 2);
    console.log('');
    console.log(chalk.hex('#3B82F6').bold(`  Meeting prep: ${company}`));
    console.log(chalk.gray('  ─────────────────────────────────────────'));
    console.log('');
    console.log(content);
    console.log('');
    console.log(chalk.bold('  Prepare for the conversation'));
    console.log(`  ${prepareUrl(parsed)}`);
    console.log(chalk.gray('  Talk it through in Deal Prep with the buyers you\'ll meet, played by Andru.'));
    console.log('');
    console.log(chalk.gray('  Powered by Andru — andru-ai.com'));
    console.log('');
  } catch (error) {
    spinner.fail(`Meeting prep failed: ${error.message}`);
    process.exit(1);
  }
}
