/**
 * Andru API Client for CLI
 *
 * Adapted from packages/mcp-server-andru-intelligence/src/client.js
 * Used for AI-powered operations when ANDRU_API_KEY is set.
 */

const DEFAULT_API_URL = 'https://api.andru-ai.com';
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
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'User-Agent': 'andru-intel-cli/0.1.0',
        },
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
