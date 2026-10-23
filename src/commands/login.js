/**
 * login / signup / whoami (1.4.0; copy batch 6 K, approved by Geter 2026-10-23)
 *
 * andru-intel login      (or signup: the same thing)
 *   Sign in or create an account with an email, the same way agents do over MCP and A2A
 *   (signup_start). One email carries a 6-digit code and an Approve button: type the code here, or
 *   tap Approve and the CLI notices (signup_status). The API key is saved on this computer.
 *
 * andru-intel whoami
 *   The account, this key's limits and what it can still spend today.
 */

import { createInterface } from 'node:readline';
import { AndruClient } from '../services/apiClient.js';
import { saveCredentials, getApiKey, NOT_SIGNED_IN } from '../services/credentials.js';

/** An account tool's reply: the JSON inside the MCP text content (or the body as is). */
export function readReply(body) {
  const text = body?.content?.[0]?.text;
  if (typeof text !== 'string') return body || {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function accountCall(client, tool, args) {
  try {
    return readReply(await client.callTool(tool, args));
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait for the person: a typed code (signup_verify) or the Approve button (signup_status), whichever
 * comes first. Resolves to the signed-in reply. Exported for tests.
 */
export async function waitForApproval({ client, email, requestId, pollAfterSeconds = 5, ask, out = console }) {
  let done = false;
  const finish = (reply) => { done = true; return reply; };

  const byApprove = (async () => {
    if (!requestId) return new Promise(() => {}); // no Approve to wait for
    for (;;) {
      await sleep(Math.max(1, pollAfterSeconds) * 1000);
      if (done) return new Promise(() => {});
      const r = await accountCall(client, 'signup_status', { requestId });
      if (r.apiKey) return finish(r);
      if (r.status === 'expired' || (r.status === 'error' && r.code !== 'RATE_LIMITED')) return finish(r);
      if (r.poll_after_seconds) pollAfterSeconds = r.poll_after_seconds;
    }
  })();

  const byCode = (async () => {
    if (!ask) return new Promise(() => {}); // not a terminal: wait for Approve only
    for (;;) {
      const code = (await ask('Code (or wait for Approve): ')).trim();
      if (done) return new Promise(() => {});
      if (!code) continue;
      const r = await accountCall(client, 'signup_verify', { email, code });
      if (r.apiKey) return finish(r);
      // The backend's own message (approved wording, the same on every channel).
      out.error(r.message || r.code);
      if (['CODE_EXPIRED', 'TOO_MANY_ATTEMPTS', 'EXPIRED'].includes(r.code)) return finish(r);
    }
  })();

  return Promise.race([byApprove, byCode]);
}

export async function loginCommand(options = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  try {
    const email = (options.email || (await ask('Your email: '))).trim();
    // No key yet: the signup calls work without one.
    const client = new AndruClient(null);
    const started = await accountCall(client, 'signup_start', { email, agentName: 'andru-intel', foundVia: 'npm' });
    if (started.status !== 'code_sent') {
      console.error(started.message || started.code);
      process.exit(1);
    }
    console.log(`Andru emailed ${email} a 6-digit code and an Approve button. Type the code here, or tap Approve in the email.`);

    // Not a terminal (a script): no code to type, so only the Approve button finishes it.
    const r = await waitForApproval({ client, email, requestId: started.request_id, pollAfterSeconds: started.poll_after_seconds, ask: process.stdin.isTTY ? ask : null });
    if (!r?.apiKey) {
      console.error(r?.message || r?.code);
      process.exit(1);
    }
    const path = saveCredentials({ apiKey: r.apiKey, email: r.account?.email || email, keyName: r.keyName });
    console.log(`Signed in as ${r.account?.email || email}. Your API key is saved in ${path}; only your user can read it. Commands on this computer use it from now on.`);
  } finally {
    rl.close();
  }
  // The Approve poll may still be sleeping; nothing else is left to do.
  process.exit(0);
}

/** Copy batch 6 K3: one label per line. Exported for tests. */
export function whoamiLines(r) {
  const lim = r.limits;
  const none = (v) => v === 'no limit' || v === null || v === undefined;
  // Free calls only: $0 a day (and $0 or nothing a month), or $0 a month with nothing a day.
  const free = lim && ((lim.per_day === '$0.00' && (lim.per_month === '$0.00' || none(lim.per_month))) || (lim.per_month === '$0.00' && none(lim.per_day)));
  const parts = lim ? [none(lim.per_day) ? null : `${lim.per_day} a day`, none(lim.per_month) ? null : `${lim.per_month} a month`].filter(Boolean) : [];
  const spend = free ? 'free calls only' : parts.length ? parts.join(', ') : null;
  const freeLeft = r.free_calls_left_today && typeof r.free_calls_left_today === 'object'
    ? r.free_calls_left_today.mcp
    : r.free_calls_left_today;
  return [
    `Account: ${r.account ?? '—'}`,
    `Key: ${r.key_name ?? '—'}`,
    ...(spend ? [`Can spend without asking: ${spend}`] : []),
    ...(r.can_spend_today ? [`Left today: ${r.can_spend_today}`] : []),
    `Wallet: ${r.wallet_balance ?? '—'}`,
    `Free calls left today: ${freeLeft ?? '—'}`,
  ];
}

export async function whoamiCommand(options = {}) {
  const key = getApiKey();
  if (!key) {
    console.error(NOT_SIGNED_IN);
    process.exit(1);
  }
  const r = await accountCall(new AndruClient(key), 'whoami', {});
  if (r.status !== 'ok') {
    console.error(r.message || r.code);
    process.exit(1);
  }
  if (options.json) { console.log(JSON.stringify(r, null, 2)); return; }
  console.log(whoamiLines(r).join('\n'));
}
