/**
 * Feed pages are not cached: a thought published from the phone has to be
 * visible on the next refresh, and any shared cache makes that a lie for up to
 * its lifetime. Each render costs two GitHub API calls instead, which is well
 * inside the authenticated rate limit for a personal site.
 */
export const FEED_CACHE_CONTROL = 'no-store';
