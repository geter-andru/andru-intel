/**
 * blueprint command
 *
 * andru-intel blueprint --stage "Series A" --arr "$2M"
 * andru-intel blueprint --stage "Seed" --arr "$500K" --json
 *
 * Requires ANDRU_API_KEY — AI-powered operation.
 */

import chalk from 'chalk';
import { formatJSON } from '../formatters/json.js';

export async function blueprintCommand(options) {
  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required for sales blueprint generation.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const spinner = ora('Generating first sales hire blueprint...').start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);

    const result = await client.callTool('get_sales_blueprint', {
      companyStage: options.stage || 'Series A',
      arrTarget: options.arr || '$2M',
      ...(options.dealSize && { dealSize: options.dealSize }),
      ...(options.cycle && { avgCycleLength: options.cycle }),
      ...(options.team && { teamSize: options.team }),
    });

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
      console.log('');
      console.log(chalk.hex('#3B82F6').bold('  First Sales Hire Blueprint'));
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
    spinner.fail(`Blueprint generation failed: ${error.message}`);
    process.exit(1);
  }
}
