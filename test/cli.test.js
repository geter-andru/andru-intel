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
