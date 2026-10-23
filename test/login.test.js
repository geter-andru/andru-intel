/**
 * Sign in from the terminal (1.4.0; copy batch 6 K and J3, approved by Geter 2026-10-23): the saved
 * key (readable by this user only), which key wins, login by code or by the Approve button, whoami's
 * lines, and --max-price sent as maxAmountCents.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { saveCredentials, readCredentials, getApiKey, credentialsPath, NOT_SIGNED_IN } from '../src/services/credentials.js';
import { waitForApproval, whoamiLines, readReply } from '../src/commands/login.js';
import { maxAmountCents, withMaxPrice } from '../src/services/maxPrice.js';

const tempEnv = () => ({ ANDRU_CONFIG_DIR: mkdtempSync(join(tmpdir(), 'andru-intel-')) });

test('login saves the key readable by this user only, and commands use it', () => {
  const env = tempEnv();
  assert.equal(getApiKey(env), null);
  const file = saveCredentials({ apiKey: 'sk_live_test', email: 'a@acme.com', keyName: 'andru-intel' }, env);
  assert.equal(file, credentialsPath(env));
  if (process.platform !== 'win32') assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.equal(readCredentials(env).email, 'a@acme.com');
  assert.equal(getApiKey(env), 'sk_live_test');
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).apiKey, 'sk_live_test');
});

test('ANDRU_API_KEY wins over the saved key', () => {
  const env = tempEnv();
  saveCredentials({ apiKey: 'sk_live_saved' }, env);
  assert.equal(getApiKey({ ...env, ANDRU_API_KEY: 'sk_live_env' }), 'sk_live_env');
});

test('whoami with no key says K4 and exits 1', () => {
  const env = { ...process.env, ...tempEnv() };
  delete env.ANDRU_API_KEY;
  const r = spawnSync(process.execPath, ['src/index.js', 'whoami'], { cwd: new URL('..', import.meta.url), env, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.trim(), NOT_SIGNED_IN);
  assert.equal(NOT_SIGNED_IN, 'Not signed in. Run andru-intel login, or set ANDRU_API_KEY.');
});

// A fake backend: answers the account tools the way POST /api/mcp/tools/call does.
function fakeClient(replies) {
  const calls = [];
  return {
    calls,
    async callTool(tool, args) {
      calls.push({ tool, args });
      const next = replies[tool]?.shift?.() ?? replies[tool];
      return { content: [{ type: 'text', text: JSON.stringify(typeof next === 'function' ? next(args) : next) }] };
    },
  };
}

test('login by code: a wrong code shows the backend\'s message, the right one signs in', async () => {
  const client = fakeClient({
    signup_verify: [{ status: 'error', code: 'INVALID_CODE', message: 'That code is not right. Check the email and try again.' }, { status: 'signed_in', apiKey: 'sk_live_new', keyName: 'andru-intel' }],
  });
  const typed = ['111111', '222222'];
  const errors = [];
  const r = await waitForApproval({ client, email: 'a@acme.com', requestId: null, ask: async () => typed.shift(), out: { error: (m) => errors.push(m) } });
  assert.equal(r.apiKey, 'sk_live_new');
  assert.deepEqual(errors, ['That code is not right. Check the email and try again.']);
  assert.deepEqual(client.calls.map((c) => c.args.code), ['111111', '222222']);
});

test('login by the Approve button: signup_status until it returns the key', async () => {
  const client = fakeClient({ signup_status: [{ status: 'waiting', poll_after_seconds: 1 }, { status: 'signed_in', apiKey: 'sk_live_tap' }] });
  const r = await waitForApproval({ client, email: 'a@acme.com', requestId: 'req-1', pollAfterSeconds: 1, ask: null });
  assert.equal(r.apiKey, 'sk_live_tap');
  assert.deepEqual(client.calls.map((c) => c.tool), ['signup_status', 'signup_status']);
});

test('an expired request ends the wait with the backend\'s message', async () => {
  const client = fakeClient({ signup_status: [{ status: 'expired', message: 'This request expired.' }] });
  const r = await waitForApproval({ client, email: 'a@acme.com', requestId: 'req-1', pollAfterSeconds: 1, ask: null });
  assert.equal(r.status, 'expired');
});

test('whoami prints the K3 lines', () => {
  const lines = whoamiLines({ account: 'a@acme.com', key_name: 'andru-intel', limits: { per_day: '$75.00', per_month: 'no limit' }, can_spend_today: '$72.00', wallet_balance: '$22.00', free_calls_left_today: { mcp: 4, a2a: 5 } });
  assert.deepEqual(lines, ['Account: a@acme.com', 'Key: andru-intel', 'Can spend without asking: $75.00 a day', 'Left today: $72.00', 'Wallet: $22.00', 'Free calls left today: 4']);
  assert.ok(whoamiLines({ limits: { per_day: '$0.00', per_month: '$0.00' } }).includes('Can spend without asking: free calls only'));
  assert.ok(whoamiLines({ limits: { per_day: '$75.00', per_month: '$300.00' } }).includes('Can spend without asking: $75.00 a day, $300.00 a month'));
});

test('--max-price is sent as maxAmountCents; nonsense counts as $0', () => {
  assert.equal(maxAmountCents(undefined), undefined);
  assert.equal(maxAmountCents('12'), 1200);
  assert.equal(maxAmountCents('$3.50'), 350);
  assert.equal(maxAmountCents('lots'), 0);
  assert.deepEqual(withMaxPrice({ asset: 'x' }, undefined), { asset: 'x' });
  assert.deepEqual(withMaxPrice({ asset: 'x' }, '49'), { asset: 'x', maxAmountCents: 4900 });
});

test('a reply is read from the MCP text content', () => {
  assert.deepEqual(readReply({ content: [{ type: 'text', text: '{"status":"ok"}' }] }), { status: 'ok' });
});
