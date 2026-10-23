/**
 * --max-price <dollars> (1.4.0; copy batch 6 J3, approved by Geter 2026-10-23): the most one call may
 * cost. Sent as maxAmountCents; above it the backend runs nothing and charges nothing. A value that
 * isn't a dollar amount counts as $0, the strictest reading, as the backend does.
 */
export function maxAmountCents(dollars) {
  if (dollars === undefined || dollars === null || dollars === true) return undefined;
  const n = Number(String(dollars).trim().replace(/^\$/, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

/** The ceiling as a tool argument, or nothing when none was given. */
export const withMaxPrice = (args, dollars) => {
  const cents = maxAmountCents(dollars);
  return cents === undefined ? args : { ...args, maxAmountCents: cents };
};
