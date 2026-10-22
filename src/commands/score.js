/**
 * score command
 *
 * andru-intel score "AI-powered code review for enterprise teams"
 * andru-intel score "..." --vertical medical --role CTO
 * andru-intel score --ai              (your account's ICP; requires ANDRU_API_KEY)
 * andru-intel score "..." --json
 *
 * Without --ai the ICP is built offline from the description. With --ai it is the ICP saved in
 * your Andru account (get_icp_profile, free); the old AI demo endpoint was retired (Geter, 2026-10-22).
 */

import { buildLocalICP } from '../services/localICP.js';
import { formatICP, formatAccountICP } from '../formatters/terminal.js';
import { formatJSON } from '../formatters/json.js';

export async function scoreCommand(description, options) {
  if (options.ai) {
    if (!process.env.ANDRU_API_KEY) {
      console.error('ANDRU_API_KEY environment variable required for --ai mode.');
      console.error('Set it: export ANDRU_API_KEY=your_key');
      console.error('Get one: https://platform.andru-ai.com/settings/developer');
      process.exit(1);
    }
    await scoreFromAccount(description, options);
    return;
  }

  if (!description) {
    console.error('Give a product description, or use --ai for the ICP in your Andru account.');
    console.error('Example: andru-intel score "AI-powered code review for enterprise teams"');
    process.exit(1);
  }
  scoreLocal(description, options);
}

function scoreLocal(description, options) {
  const result = buildLocalICP({
    description,
    vertical: options.vertical,
    role: options.role,
  });

  if (options.json) {
    console.log(formatJSON(result));
  } else {
    console.log(formatICP(result));
  }
}

/** Parse an MCP tool response: the JSON in content[0].text, or the response itself. */
export function toolData(result) {
  const text = result?.content?.[0]?.text;
  if (!text) return result;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function scoreFromAccount(description, options) {
  const { default: ora } = await import('ora');
  const spinner = ora('Reading your ICP...').start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);
    const profile = toolData(await client.callTool('get_icp_profile', {}));

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(profile));
      return;
    }
    if (profile?.status === 'building' || profile?.status === 'no_data' || !profile?.layer1) {
      console.log('');
      console.log('  ' + (profile?.status === 'building'
        ? 'Your ICP is being built. Try again in a minute.'
        : 'Your Andru account has no ICP yet. Build it at https://platform.andru-ai.com/icp'));
      console.log('');
      return;
    }
    if (description) {
      console.log('');
      console.log('  This is the ICP saved in your Andru account; the description you gave was not used.');
    }
    console.log(formatAccountICP(profile));
  } catch (error) {
    spinner.fail(`Could not read your ICP: ${error.message}`);
    process.exit(1);
  }
}
