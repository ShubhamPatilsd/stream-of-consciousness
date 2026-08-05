/**
 * Feed pages are rendered per request but served from Vercel's edge cache, so
 * a reader almost never waits on GitHub. `stale-while-revalidate` keeps the
 * last good page up if GitHub is slow or briefly unavailable.
 */
export const FEED_CACHE_CONTROL =
	'public, s-maxage=60, stale-while-revalidate=86400';
