/**
 * roleplay command
 *
 * andru-intel roleplay CFO
 * andru-intel roleplay "VP Sales" --product "AI code review platform"
 * andru-intel roleplay --list
 * andru-intel roleplay CTO --json
 *
 * Requires ANDRU_API_KEY — AI-powered persona simulation.
 */

import chalk from 'chalk';
import { formatJSON } from '../formatters/json.js';

const PERSONAS = ['CFO', 'CTO', 'COO', 'VP Sales', 'VP Engineering'];

export async function roleplayCommand(persona, options) {
  if (options.list) {
    console.log('');
    console.log(chalk.hex('#3B82F6').bold('  Available Buyer Personas'));
    console.log(chalk.gray('  ─────────────────────────────────────────'));
    PERSONAS.forEach(p => console.log('    ' + chalk.gray('•') + ' ' + p));
    console.log('');
    console.log(chalk.gray('  Usage: andru-intel roleplay CFO'));
    console.log('');
    return;
  }

  if (!persona) {
    console.error('Specify a persona: andru-intel roleplay CFO');
    console.error(`Available: ${PERSONAS.join(', ')}`);
    process.exit(1);
  }

  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required for persona simulation.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const spinner = ora(`Simulating ${persona} buyer persona...`).start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);

    const result = await client.callTool('simulate_buyer_persona', {
      persona,
      mode: 'opening',
      ...(options.product && { productContext: options.product }),
    });

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
      console.log('');
      console.log(chalk.hex('#3B82F6').bold(`  Buyer Simulation: ${persona}`));
      console.log(chalk.gray('  ─────────────────────────────────────────'));
      console.log('');
      try {
        const data = JSON.parse(content);
        if (data.openingMessage) {
          console.log(chalk.italic(`  "${data.openingMessage}"`));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch {
        console.log('  ' + content);
      }
      console.log('');
      console.log(chalk.gray('  Powered by Andru — andru-ai.com'));
      console.log('');
    }
  } catch (error) {
    spinner.fail(`Simulation failed: ${error.message}`);
    process.exit(1);
  }
}
