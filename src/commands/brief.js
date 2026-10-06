/**
 * brief command
 *
 * andru-intel brief "Acme Corp" --type discovery
 * andru-intel brief "Acme Corp" --json
 *
 * Requires ANDRU_API_KEY — this is always an AI-powered operation.
 */

import { formatJSON } from '../formatters/json.js';
import chalk from 'chalk';

export async function briefCommand(company, options) {
  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY environment variable required for briefs.');
    console.error('Set it: export ANDRU_API_KEY=your_key');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const spinner = ora(`Generating ${options.type} brief for ${company}...`).start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);

    const result = await client.callTool('pre-meeting-brief', {
      companyName: company,
      meetingType: options.type,
    });

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      // Extract text content from MCP tool response
      const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
      console.log('');
      console.log(chalk.hex('#3B82F6').bold(`  Pre-Meeting Brief: ${company}`));
      console.log(chalk.gray('  ─────────────────────────────────────────'));
      console.log('');
      console.log(content);
      console.log('');
      console.log(chalk.gray('  Powered by Andru — andru-ai.com'));
      console.log('');
    }
  } catch (error) {
    spinner.fail(`Brief generation failed: ${error.message}`);
    process.exit(1);
  }
}
