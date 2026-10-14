import { createHash } from 'node:crypto';

type MachineResponseOptions = {
  contentLanguage: string;
  contentType: string;
};

function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;

  return ifNoneMatch.split(',').some((candidate) => {
    const value = candidate.trim();
    return value === '*' || value === etag || value === `W/${etag}`;
  });
}

export function createMachineReadableResponse(
  request: Request,
  body: string,
  { contentLanguage, contentType }: MachineResponseOptions,
): Response {
  const etag = `"${createHash('sha256').update(body).digest('base64url')}"`;
  const headers = {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    'Content-Language': contentLanguage,
    'Content-Type': contentType,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, follow',
  };

  if (matchesEtag(request.headers.get('if-none-match'), etag)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { status: 200, headers });
}
