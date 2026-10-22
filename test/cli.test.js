// andru-intel lists and runs the same 30 tools as the Andru backend and the MCP server (Geter,
// 2026-10-08). Pins the count, the held-back CRM tools and the help text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALL_TOOLS } from '../src/commands/run.js';
import { TOOL_DESCRIPTIONS } from '../src/commands/list.js';

test('30 tools, unique, without the held-back CRM tools', () => {
  assert.equal(ALL_TOOLS.length, 30);
  assert.equal(new Set(ALL_TOOLS).size, ALL_TOOLS.length);
  for (const held of ['get_syndication_status', 'trigger_syndication', 'sync_crm_deals']) assert.ok(!ALL_TOOLS.includes(held), held);
});

test('every tool has a list description, and no description is for a tool the CLI does not run', () => {
  assert.deepEqual(Object.keys(TOOL_DESCRIPTIONS).sort(), [...ALL_TOOLS].sort());
});

test('help text states no stale counts or retired claims', () => {
  const src = ['src/index.js', 'src/commands/list.js', 'src/commands/assets.js'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(src, /\b19 tools|\b138\b|Operational empathy|syndication to CRMs/i);
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.description, /^Revenue intelligence for complex B2B growth\./);
});

test("'run <tool> --param value' parses (it failed with 'too many arguments' in 1.1.0)", async () => {
  const { spawnSync } = await import('node:child_process');
  const env = { ...process.env };
  delete env.ANDRU_API_KEY;
  const r = spawnSync(process.execPath, ['src/index.js', 'run', 'consult_agent', '--question', 'test'], { cwd: new URL('..', import.meta.url), env, encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  assert.doesNotMatch(out, /too many arguments/);
  assert.match(out, /ANDRU_API_KEY required/);
});

test('the README states the real counts and current prices', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, new RegExp(`all ${ALL_TOOLS.length} of Andru's tools`));
  assert.match(readme, /catalog of 139 assets/);
  assert.doesNotMatch(readme, /\b138\b|\$1\.50|\b19 tools/);
});

test('offline personas are titles only, no fictional names (Geter, 2026-10-09)', async () => {
  const { buildLocalICP, getPersona, listPersonaKeys } = await import('../src/services/localICP.js');
  const out = JSON.stringify([buildLocalICP({ description: 'AI code review for fintech' }), ...listPersonaKeys().map(getPersona)]);
  assert.doesNotMatch(out, /Janet|Marcus|Diana|"Rob"|Priya|firstName/);
});

test('the README says free calls are per channel, not shared', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.doesNotMatch(readme, /shared (across|with) (MCP|A2A)/i);
  assert.match(readme, /5 free calls a day on MCP \(and another 5 on A2A\) cover pre-meeting briefs and quick thesis checks/);
});

test('tool list uses buyer-side language (approved by Geter, 2026-10-09)', () => {
  assert.doesNotMatch(Object.values(TOOL_DESCRIPTIONS).join('\n'), /MBTI|battle ?card|objection/i);
});

test('role-play prepares for the real meeting, not pitch practice (Geter, 2026-10-09)', () => {
  const text = ['src/index.js', 'src/commands/list.js', 'README.md'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(text, /practi[cs]e (your|a) pitch|pitch practice|push(es)? back/i);
});

test('--version prints the package version', async () => {
  const { spawnSync } = await import('node:child_process');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const r = spawnSync(process.execPath, ['src/index.js', '--version'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(r.stdout.trim(), pkg.version);
});

test('requests report the real version and only send X-API-Key when there is a key', async () => {
  const { userAgent, requestHeaders } = await import('../src/services/apiClient.js');
  const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  assert.equal(userAgent({}), `andru-intel-cli/${version}`);
  assert.equal(userAgent({ ANDRU_TEST_RUN: '1' }), `andru-intel-cli/${version} (test)`);
  assert.equal('X-API-Key' in requestHeaders(undefined, {}), false);
  assert.equal(requestHeaders('sk_live_x', {})['X-API-Key'], 'sk_live_x');
});

test('every named command calls a tool the backend has (brief called "pre-meeting-brief" through 1.2.4)', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../src/commands/', import.meta.url);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const [, name] of src.matchAll(/callTool\(\s*['"]([^'"]+)['"]/g)) assert.ok(ALL_TOOLS.includes(name), `${f} calls unknown tool ${name}`);
  }
});

test('score --ai reads the account ICP (get_icp_profile), not the retired microapps endpoint', () => {
  const score = readFileSync(new URL('../src/commands/score.js', import.meta.url), 'utf8');
  const client = readFileSync(new URL('../src/services/apiClient.js', import.meta.url), 'utf8');
  assert.match(score, /callTool\('get_icp_profile'/);
  assert.doesNotMatch(client, /microapps/);
});

test('the account ICP shows people by title and role, never by name', async () => {
  const { formatAccountICP } = await import('../src/formatters/terminal.js');
  const out = formatAccountICP({
    product: { description: 'Observability' },
    layer1: { companyIntelligence: { industry: 'SaaS', painTriggers: ['Outages'] } },
    layer2: { personas: [{ title: 'VP Engineering', successMetrics: ['MTTR'] }], buyingCommittee: [{ role: 'Economic buyer', title: 'CFO', name: 'Jane Example' }] },
  });
  assert.match(out, /VP Engineering/);
  assert.match(out, /CFO/);
  assert.doesNotMatch(out, /Jane Example/);
});

test('prep writes the brief and points to Deal Prep: the meeting when Andru matched one (Geter, 2026-10-22)', async () => {
  const { prepareUrl } = await import('../src/commands/prep.js');
  assert.equal(prepareUrl({ meeting: { eventId: 'evt 1' } }), 'https://platform.andru-ai.com/deal-prep?meeting=evt%201');
  assert.equal(prepareUrl({}), 'https://platform.andru-ai.com/deal-prep');
  const prep = readFileSync(new URL('../src/commands/prep.js', import.meta.url), 'utf8');
  assert.match(prep, /callTool\('get_pre_brief'/);
});

test('roleplay is gone from the CLI; prep (alias brief) replaces it', async () => {
  const { spawnSync } = await import('node:child_process');
  const help = spawnSync(process.execPath, ['src/index.js', '--help'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).stdout;
  assert.match(help, /prep\|brief/);
  assert.doesNotMatch(help, /roleplay/);
  const text = ['src/index.js', 'src/commands/list.js', 'README.md'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(text, /roleplay|rehears|\$3 or less/i);
});
