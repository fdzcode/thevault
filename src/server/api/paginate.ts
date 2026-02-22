/**
 * Extracts cursor pagination from a query result.
 *
 * Usage: Pass results from a `findMany({ take: limit + 1, ... })` call.
 * Returns the trimmed items and the cursor for the next page.
 */
export function paginateResults<T extends { id: string }>(
  items: T[],
  limit: number,
): { items: T[]; nextCursor: string | undefined } {
  if (items.length <= limit) {
    return { items, nextCursor: undefined };
  }
  return {
    items: items.slice(0, limit),
    nextCursor: items[limit]?.id,
  };
}
