/**
 * score command
 *
 * andru-intel score "AI-powered code review for enterprise teams"
 * andru-intel score "..." --vertical medical --role CTO
 * andru-intel score "..." --ai        (requires ANDRU_API_KEY)
 * andru-intel score "..." --json
 */

import { buildLocalICP } from '../services/localICP.js';
import { formatICP, formatAIICP } from '../formatters/terminal.js';
import { formatJSON } from '../formatters/json.js';

export async function scoreCommand(description, options) {
  const useAI = options.ai && process.env.ANDRU_API_KEY;

  if (options.ai && !process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY environment variable required for --ai mode.');
    console.error('Set it: export ANDRU_API_KEY=your_key');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    console.error('\nRunning in offline mode instead...\n');
  }

  if (useAI) {
    await scoreWithAI(description, options);
  } else {
    scoreLocal(description, options);
  }
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

async function scoreWithAI(description, options) {
  const { default: ora } = await import('ora');
  const spinner = ora('Analyzing product truth...').start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);
    const result = await client.generateICP(description);

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      console.log(formatAIICP(result));
    }
  } catch (error) {
    spinner.fail(`AI analysis failed: ${error.message}`);
    console.error('\nFalling back to offline mode...\n');
    scoreLocal(description, options);
  }
}
