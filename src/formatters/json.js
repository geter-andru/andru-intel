/**
 * JSON Formatter
 *
 * Clean JSON output for piping to other tools.
 */

export function formatJSON(data) {
  return JSON.stringify(data, null, 2);
}
