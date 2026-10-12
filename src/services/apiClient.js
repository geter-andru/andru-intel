/**
 * Andru API Client for CLI
 *
 * Adapted from packages/mcp-server-andru-intelligence/src/client.js
 * Used for AI-powered operations when ANDRU_API_KEY is set.
 */

import { readFileSync } from 'node:fs';

const DEFAULT_API_URL = 'https://api.andru-ai.com';
const VERSION = (() => {
  try { return JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version; } catch { return 'unknown'; }
})();

/** The real version (every release sent "0.1.0" before 1.2.4); "(test)" marks our own test runs. */
export function userAgent(env = process.env) {
  return `andru-intel-cli/${VERSION}${env.ANDRU_TEST_RUN === '1' ? ' (test)' : ''}`;
}

/** Only send X-API-Key when there is a key: a missing key went out as the text "undefined". */
export function requestHeaders(apiKey, env = process.env) {
  const headers = { 'Content-Type': 'application/json', 'User-Agent': userAgent(env) };
  if (apiKey) headers['X-API-Key'] = apiKey;
  return headers;
}
const REQUEST_TIMEOUT_MS = 90_000; // 90s for AI operations

export class AndruClient {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || process.env.ANDRU_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
  }

  /**
   * Generate AI-powered ICP via the demo endpoint.
   */
  async generateICP(productDescription) {
    return this.post('/api/microapps/icp-generator/generate', {
      productName: extractName(productDescription),
      productDescription,
    });
  }

  /**
   * Call an MCP tool on the backend.
   */
  async callTool(name, args) {
    return this.post('/api/mcp/tools/call', { tool: name, arguments: args });
  }

  async post(path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: requestHeaders(this.apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let msg;
        try {
          const parsed = JSON.parse(errorBody);
          // The backend sends { error: 'text' } or { error: { code, message } }; an object here
          // printed as "[object Object]" in 1.1.0.
          const e = parsed.error;
          msg = (typeof e === 'string' && e) || e?.message || parsed.message || `HTTP ${response.status}`;
        } catch {
          msg = `HTTP ${response.status}: ${errorBody.slice(0, 200)}`;
        }
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractName(description) {
  const match = description.match(/^([^,\-–—.]+)/);
  if (match && match[1].trim().length <= 60) return match[1].trim();
  return description.split(/\s+/).slice(0, 5).join(' ');
}
