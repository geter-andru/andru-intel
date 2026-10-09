/**
 * Asset catalog commands (2026-10-06)
 *
 * andru-intel assets [keywords] [--group Core|Advanced|Strategic|Buy-side] [--available]
 * andru-intel generate "<asset name>" [--out file.md] [--no-wait]
 * andru-intel get-asset <job_id> [--out file.md]
 *
 * Search Andru's 139-asset catalog (free), generate any asset at its catalog price
 * (Tool $3 / Framework $12 / Decision $49; your first ICP is free), and save it as markdown.
 * Requires ANDRU_API_KEY.
 */

import fs from 'node:fs';
import chalk from 'chalk';

const POLL_MS = Number(process.env.ANDRU_POLL_MS) || 10_000;
const MAX_WAIT_MS = 15 * 60_000;

async function client() {
  if (!process.env.ANDRU_API_KEY) {
    console.error('ANDRU_API_KEY required.');
    console.error('Get one: https://platform.andru-ai.com/settings/developer');
    process.exit(1);
  }
  const { AndruClient } = await import('../services/apiClient.js');
  return new AndruClient(process.env.ANDRU_API_KEY);
}

const firstJson = (result) => {
  try { return JSON.parse(result?.content?.[0]?.text || '{}'); } catch { return {}; }
};
const slug = (s) => String(s || 'andru-asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'andru-asset';

export async function assetsCommand(keywords = [], options = {}) {
  const c = await client();
  const query = Array.isArray(keywords) ? keywords.join(' ') : String(keywords || '');
  const result = await c.callTool('list_assets', {
    ...(query ? { query } : {}),
    ...(options.group ? { group: options.group } : {}),
    ...(options.available ? { available_only: true } : {}),
    limit: Number(options.limit) || 20,
  });
  const data = firstJson(result);
  if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
  if (!data.assets?.length) { console.log(data.hint || 'No assets matched.'); return; }
  console.log('');
  for (const a of data.assets) {
    const soon = a.available === 'yes' ? '' : chalk.gray('  (coming soon)');
    const own = a.needs_your_data ? chalk.gray('  · needs your data') : '';
    console.log(`  ${chalk.bold(a.name)}  ${chalk.hex('#3B82F6')(`${a.bucket} ${a.price}`)}${own}${soon}`);
    console.log(chalk.gray(`      ${a.what_it_is}`));
    console.log(chalk.gray(`      Outcome: ${a.business_outcome}`));
    console.log('');
  }
  console.log(chalk.gray('  Generate one:  andru-intel generate "<asset name>"'));
  console.log('');
}

async function collect(c, jobId, outPath) {
  const { default: ora } = await import('ora');
  const spinner = ora('Building...').start();
  const started = Date.now();
  for (;;) {
    const result = await c.callTool('get_asset', { job_id: jobId });
    const meta = firstJson(result);
    if (meta.status === 'complete') {
      const markdown = result?.content?.[1]?.text;
      if (!markdown) { spinner.succeed(meta.message || 'Finished — it is in your Andru library.'); return; }
      const file = outPath || `${slug(meta.asset)}.md`;
      fs.writeFileSync(file, markdown);
      spinner.succeed(`Saved ${meta.asset} to ${file}  (charged ${meta.charged}; also in your Andru library)`);
      return;
    }
    if (meta.status !== 'generating') {
      spinner.fail(meta.message || `Asset job ${meta.status || 'failed'}.`);
      process.exit(1);
    }
    spinner.text = `${meta.asset}: ${meta.progress ?? 0}%${meta.stage ? ` (${meta.stage})` : ''}`;
    if (Date.now() - started > MAX_WAIT_MS) {
      spinner.info(`Still building. Collect it later:  andru-intel get-asset ${jobId}`);
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

export async function generateCommand(asset, options = {}) {
  const c = await client();
  const result = await c.callTool('generate_asset', { asset });
  const data = firstJson(result);
  if (data.status !== 'generating') {
    console.error(data.message || 'Could not start the asset.');
    if (data.suggestions?.length) console.error(`Try: ${data.suggestions.join(' · ')}`);
    if (data.topup_url) console.error(`Top up: ${data.topup_url}`);
    process.exit(1);
  }
  console.log(`Generating ${chalk.bold(data.asset)} — ${data.price}`);
  if (options.wait === false) {
    console.log(`Collect it with:  andru-intel get-asset ${data.job_id}`);
    return;
  }
  await collect(c, data.job_id, options.out || null);
}

export async function getAssetCommand(jobId, options = {}) {
  await collect(await client(), jobId, options.out || null);
}
