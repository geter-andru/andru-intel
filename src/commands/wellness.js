/**
 * wellness command
 *
 * andru-intel wellness
 * andru-intel wellness --json
 *
 * Requires ANDRU_API_KEY — reads your wellness data from the platform.
 */

import chalk from 'chalk';
import { formatJSON } from '../formatters/json.js';

export async function wellnessCommand(options) {
  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required for wellness check.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }

  const { default: ora } = await import('ora');
  const spinner = ora('Checking founder wellness signals...').start();

  try {
    const { AndruClient } = await import('../services/apiClient.js');
    const client = new AndruClient(process.env.ANDRU_API_KEY);

    const result = await client.callTool('get_founder_wellness', {
      mode: options.mode || 'assessment',
    });

    spinner.stop();

    if (options.json) {
      console.log(formatJSON(result));
    } else {
      const content = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
      console.log('');
      console.log(chalk.hex('#3B82F6').bold('  Founder Wellness Check'));
      console.log(chalk.gray('  ─────────────────────────────────────────'));
      console.log('');
      try {
        const data = JSON.parse(content);
        // The backend returns riskLevel / burnoutScore (and status 'not_scored' with a message when
        // there's no activity to measure); burnoutRisk.{level,score} is the shape before 1.2.5.
        const level = data.riskLevel ?? data.burnoutRisk?.level;
        const score = data.burnoutScore ?? data.burnoutRisk?.score;
        if (data.status === 'not_scored' && data.message) {
          console.log('  ' + data.message);
          console.log('');
        }
        if (level) {
          const riskColor = level === 'high' || level === 'critical' ? chalk.red :
            level === 'moderate' || level === 'medium' ? chalk.yellow : chalk.green;
          console.log(chalk.bold('  Burnout Risk: ') + riskColor(level.toUpperCase()));
          if (score != null) {
            console.log(chalk.bold('  Score: ') + riskColor(`${score}/100`));
          }
          console.log('');
        }
        if (data.recommendations?.length) {
          console.log(chalk.hex('#3B82F6')('  Recommendations'));
          data.recommendations.forEach(r => console.log('    ' + chalk.gray('•') + ' ' + r));
          console.log('');
        }
        if (!level && !data.recommendations?.length && data.status !== 'not_scored') {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch {
        console.log(content);
      }
      console.log('');
      console.log(chalk.gray('  Powered by Andru — andru-ai.com'));
      console.log('');
    }
  } catch (error) {
    spinner.fail(`Wellness check failed: ${error.message}`);
    process.exit(1);
  }
}
