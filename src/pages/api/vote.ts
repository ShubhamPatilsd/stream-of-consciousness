import type { APIRoute } from 'astro';
import { purgeFeedCache } from '../../lib/feed-cache';
import { appendGitHubLine } from '../../lib/publishing/github';
import { serializeVote, VOTES_FILE_PATH } from '../../lib/votes';

export const prerender = false;

/**
 * Votes come from a plain HTML form, so the site keeps shipping no client-side
 * JavaScript. The response redirects back to the page the vote came from.
 */
export const POST: APIRoute = async ({ request }) => {
	const githubToken = process.env.GITHUB_TOKEN ?? '';
	if (!githubToken) {
		return new Response('Voting is not configured.', { status: 503 });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return new Response('Request body must be a form.', { status: 400 });
	}

	const thoughtId = form.get('thoughtId');
	const vote = form.get('vote');
	if (
		typeof thoughtId !== 'string' ||
		!thoughtId ||
		thoughtId.length > 100 ||
		(vote !== 'up' && vote !== 'down')
	) {
		return new Response('A vote needs a thought id and a direction.', {
			status: 400,
		});
	}

	try {
		await appendGitHubLine({
			path: VOTES_FILE_PATH,
			line: serializeVote(thoughtId, vote),
			token: githubToken,
			message: 'record vote',
		});
	} catch (error) {
		console.error('Failed to record vote', error);
		return new Response('The vote could not be recorded.', { status: 502 });
	}

	// The cached feed still shows the old counts until it is purged.
	await purgeFeedCache();

	const referer = request.headers.get('Referer');
	const back = referer && new URL(referer).origin === new URL(request.url).origin
		? referer
		: '/';

	return new Response(null, { status: 303, headers: { Location: back } });
};
