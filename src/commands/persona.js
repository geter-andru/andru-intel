/**
 * persona command
 *
 * andru-intel persona CTO
 * andru-intel persona "VP Sales"
 * andru-intel persona CFO --json
 */

import { getPersona, listPersonaKeys } from '../services/localICP.js';
import { formatPersona } from '../formatters/terminal.js';
import { formatJSON } from '../formatters/json.js';

export function personaCommand(role, options) {
  const persona = getPersona(role);

  if (!persona) {
    console.error(`Unknown role: "${role}"`);
    console.error(`Available roles: ${listPersonaKeys().join(', ')}`);
    process.exit(1);
  }

  if (options.json) {
    console.log(formatJSON(persona));
  } else {
    console.log(formatPersona(persona));
  }
}
