/**
 * thesis command
 *
 * andru-intel thesis "AI-powered operational empathy for SaaS founders"
 * andru-intel thesis "..." --stage "Series A" --vertical fintech
 * andru-intel thesis "..." --json
 *
 * Requires ANDRU_API_KEY — AI-powered operation.
 */

import chalk from 'chalk';
import { formatJSON } from '../formatters/json.js';

export async function thesisCommand(description, options) {
  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required for thesis matching.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const spinner = ora('Matching against VC investment theses...').start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);

    const result = await client.callTool('get_thesis_match', {
      productDescription: description,
      stage: options.stage || 'Series A',
      ...(options.arr && { arrRange: options.arr }),
      ...(options.vertical && { vertical: options.vertical }),
    });

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
      console.log('');
      console.log(chalk.hex('#3B82F6').bold('  VC Thesis Match'));
      console.log(chalk.gray('  ─────────────────────────────────────────'));
      console.log('');
      try {
        const data = JSON.parse(content);
        console.log(JSON.stringify(data, null, 2));
      } catch {
        console.log(content);
      }
      console.log('');
      console.log(chalk.gray('  Powered by Andru — andru-ai.com'));
      console.log('');
    }
  } catch (error) {
    spinner.fail(`Thesis matching failed: ${error.message}`);
    process.exit(1);
  }
}
