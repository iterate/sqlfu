// Postgres identifier quoting. Same rule as sqlite (double-quote, escape inner
// double-quotes by doubling), so this is byte-identical to the sqlite impl.
// Kept dialect-local so we don't reach across packages for a one-liner.
export function pgQuoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
