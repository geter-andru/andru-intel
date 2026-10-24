/**
 * prep command (1.3.0)
 *
 * andru-intel prep "<company>" --situation discovery --room "<title>, <title>"
 * andru-intel brief "<company>"          (same command, the name it had before)
 *
 * Writes the pre-meeting brief (the Deal Prep brief since 2026-10-24: what each person in the room
 * likely thinks going in), then points to Deal Prep on the platform for the conversation itself
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

export const SITUATIONS = ['discovery', 'deal', 'customer_review'];
export const RETIRED_FLAGS_LINE = "--contact and --type are no longer used; say who's in the room with --room.";

/** "VP Finance, IT lead" → [{ title: 'VP Finance' }, { title: 'IT lead' }] (at most 8). */
export function parseRoom(value) {
  if (!value) return [];
  return String(value).split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8).map((title) => ({ title }));
}

/** get_pre_brief's arguments from the command line (B3: the Deal Prep brief's inputs). */
export function prepArgs(company, options = {}) {
  const room = parseRoom(options.room);
  return {
    companyName: company,
    ...(options.situation ? { situation: options.situation } : {}),
    ...(room.length ? { room } : {}),
    ...(options.meeting ? { meeting: options.meeting } : {}),
  };
}

export async function prepCommand(company, options) {
  const apiKey = requireApiKey();
  if (options.contact || options.type) console.log(chalk.yellow(RETIRED_FLAGS_LINE));
  if (options.situation && !SITUATIONS.includes(options.situation)) {
    console.error(chalk.red(`--situation must be one of: ${SITUATIONS.join(', ')}`));
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const kind = String(options.situation || 'discovery').replace('_', ' ');
  const spinner = ora(`Preparing your ${kind} meeting with ${company}...`).start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(apiKey);

    const result = await client.callTool('get_pre_brief', withMaxPrice(prepArgs(company, options), options.maxPrice));

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
