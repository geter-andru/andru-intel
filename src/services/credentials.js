/**
 * The API key on this computer (1.4.0; copy batch 6 K, approved by Geter 2026-10-23).
 *
 * ANDRU_API_KEY wins when it's set. Otherwise the key `andru-intel login` saved is used, from
 * ~/.config/andru-intel/credentials.json (or $XDG_CONFIG_HOME, or %APPDATA% on Windows). The file is
 * written readable by this user only (0600, in a 0700 folder).
 */

import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Where the key is saved. ANDRU_CONFIG_DIR overrides it (tests, or a shared machine). */
export function credentialsPath(env = process.env) {
  const base = env.ANDRU_CONFIG_DIR
    || (process.platform === 'win32' && env.APPDATA ? join(env.APPDATA, 'andru-intel') : join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'andru-intel'));
  return join(base, 'credentials.json');
}

export function readCredentials(env = process.env) {
  try {
    const saved = JSON.parse(readFileSync(credentialsPath(env), 'utf8'));
    return saved && typeof saved.apiKey === 'string' ? saved : null;
  } catch {
    return null;
  }
}

/** The key to use: ANDRU_API_KEY, else the saved one, else null. */
export function getApiKey(env = process.env) {
  return env.ANDRU_API_KEY || readCredentials(env)?.apiKey || null;
}

/** Save the key from login. Returns the file's path. */
export function saveCredentials({ apiKey, email, keyName }, env = process.env) {
  const file = credentialsPath(env);
  const dir = file.slice(0, file.lastIndexOf(process.platform === 'win32' ? '\\' : '/'));
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(file, `${JSON.stringify({ apiKey, email: email || null, keyName: keyName || null, savedAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 });
  try { chmodSync(file, 0o600); } catch { /* Windows: per-user folder already */ }
  return file;
}

/** Copy batch 6 K4: a command needs a key and there isn't one. */
export const NOT_SIGNED_IN = 'Not signed in. Run andru-intel login, or set ANDRU_API_KEY.';

/** The key, or print K4 and exit. */
export function requireApiKey(env = process.env) {
  const key = getApiKey(env);
  if (!key) {
    console.error(NOT_SIGNED_IN);
    process.exit(1);
  }
  return key;
}
