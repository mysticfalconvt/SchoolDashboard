import type { NextApiRequest, NextApiResponse } from 'next';
import { umamiUrl, umamiWebsiteId } from '../../config';

// How long to serve cached Umami data before re-fetching (server-side + CDN).
// Visitor counts don't need to be fresh, so cache aggressively.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface UmamiStatsResponse {
  visitors7: number;
  visitors30: number;
  pageviews7: number;
  pageviews30: number;
}

interface CacheEntry {
  data: UmamiStatsResponse;
  expiresAt: number;
}

// Module-level caches survive across requests on a warm serverless instance.
let statsCache: CacheEntry | null = null;
let tokenCache: { token: string; expiresAt: number } | null = null;

// This Umami version returns flat totals for the requested range, with a
// separate `comparison` object holding the previous period's totals.
interface UmamiStatsPayload {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison?: Record<string, number>;
}

async function getAuthToken(endpoint: string): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;
  if (!username || !password) {
    throw new Error('UMAMI_USERNAME / UMAMI_PASSWORD are not configured');
  }

  const response = await fetch(`${endpoint}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[umami] login failed: ${response.status} — ${body}`);
    throw new Error(`Umami login failed: ${response.status}`);
  }

  const { token } = (await response.json()) as { token: string };
  // Umami tokens are long-lived; cache for an hour to be safe.
  tokenCache = { token, expiresAt: now + 60 * 60 * 1000 };
  return token;
}

async function fetchStats(
  endpoint: string,
  websiteId: string,
  token: string,
  startAt: number,
  endAt: number,
): Promise<UmamiStatsPayload> {
  const url = `${endpoint}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[umami] stats failed: ${response.status} — ${body}`);
    throw new Error(`Umami stats request failed: ${response.status}`);
  }

  return (await response.json()) as UmamiStatsPayload;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UmamiStatsResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Strip a trailing slash so we can safely append `/api/...`.
  const endpoint = umamiUrl?.replace(/\/$/, '');
  const websiteId = umamiWebsiteId;

  if (!endpoint || !websiteId) {
    return res
      .status(500)
      .json({ error: 'Umami analytics configuration is missing' });
  }

  const now = Date.now();

  // Serve from the in-memory cache when still fresh.
  if (statsCache && statsCache.expiresAt > now) {
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_MS / 1000}, stale-while-revalidate`,
    );
    return res.status(200).json(statsCache.data);
  }

  try {
    const token = await getAuthToken(endpoint);
    const day = 24 * 60 * 60 * 1000;

    const [last7, last30] = await Promise.all([
      fetchStats(endpoint, websiteId, token, now - 7 * day, now),
      fetchStats(endpoint, websiteId, token, now - 30 * day, now),
    ]);

    const data: UmamiStatsResponse = {
      visitors7: last7.visitors ?? 0,
      visitors30: last30.visitors ?? 0,
      pageviews7: last7.pageviews ?? 0,
      pageviews30: last30.pageviews ?? 0,
    };

    statsCache = { data, expiresAt: now + CACHE_TTL_MS };

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_MS / 1000}, stale-while-revalidate`,
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error('Umami Stats API Error:', error);
    // If we have any stale cached data, prefer serving it over an error.
    if (statsCache) {
      return res.status(200).json(statsCache.data);
    }
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to fetch Umami stats',
    });
  }
}
