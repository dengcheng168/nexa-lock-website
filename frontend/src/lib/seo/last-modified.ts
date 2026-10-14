type UpdatedItem = { updatedAt?: string | null };

export function latestLastModified(...collections: ReadonlyArray<ReadonlyArray<UpdatedItem>>): Date | undefined {
  let latest = Number.NEGATIVE_INFINITY;

  for (const item of collections.flat()) {
    if (!item.updatedAt) continue;
    const timestamp = Date.parse(item.updatedAt);
    if (!Number.isNaN(timestamp) && timestamp > latest) latest = timestamp;
  }

  return Number.isFinite(latest) ? new Date(latest) : undefined;
}
