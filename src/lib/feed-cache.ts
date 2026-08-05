/**
 * Feed pages are cached at Vercel's edge indefinitely and purged the moment a
 * thought is published, so readers get a cached page and publishing is still
 * immediate. A timed cache cannot do both: any lifetime long enough to be
 * worth having is long enough to hide a thought you just spoke into your phone.
 *
 * `max-age=0` keeps the page out of the browser's own cache, which we cannot
 * purge — only the shared cache, which we can.
 */
export const FEED_CACHE_CONTROL = 'public, max-age=0, s-maxage=31536000';

/** Every feed page carries this tag, so one purge clears all of them. */
export const FEED_CACHE_TAG = 'thoughts';

const onVercel = (): boolean => Boolean(process.env.VERCEL);

/**
 * Tags the response so publishing can purge it. Outside Vercel there is no
 * shared cache to tag, and a failure here must not break rendering.
 */
export async function tagFeedResponse(): Promise<void> {
	if (!onVercel()) {
		return;
	}

	try {
		const { addCacheTag } = await import('@vercel/functions');
		await addCacheTag(FEED_CACHE_TAG);
	} catch (error) {
		console.error('Could not tag the feed response for caching', error);
	}
}

/**
 * Drops every cached feed page. Deletes rather than marks stale: marking stale
 * would serve the pre-publish page to the next reader while revalidating, which
 * is the delay this whole arrangement exists to avoid.
 *
 * Returns whether the purge succeeded so the publisher can report a thought
 * that is committed but may be slow to appear, rather than claiming otherwise.
 */
export async function purgeFeedCache(): Promise<boolean> {
	if (!onVercel()) {
		return true;
	}

	try {
		const { dangerouslyDeleteByTag } = await import('@vercel/functions');
		await dangerouslyDeleteByTag(FEED_CACHE_TAG);
		return true;
	} catch (error) {
		console.error('Could not purge the feed cache', error);
		return false;
	}
}
