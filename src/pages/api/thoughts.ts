import type { APIRoute } from 'astro';
import { hasValidPublishToken } from '../../lib/publishing/auth';
import { appendGitHubLine } from '../../lib/publishing/github';
import { prepareThought } from '../../lib/publishing/prepare';
import {
	InvalidPublishRequestError,
	parsePublishRequest,
} from '../../lib/publishing/validation';
import { monthFilePath, serializeThought } from '../../lib/thought-record';
import { forgetCachedThoughts } from '../../lib/thoughts';

export const prerender = false;

function json(body: unknown, status: number): Response {
	return Response.json(body, {
		status,
		headers: {
			'Cache-Control': 'no-store',
		},
	});
}

export const POST: APIRoute = async ({ request }) => {
	const publishToken = process.env.PUBLISH_TOKEN ?? '';
	const githubToken = process.env.GITHUB_TOKEN ?? '';

	if (!publishToken || !githubToken) {
		return json({ error: 'Publishing is not configured.' }, 503);
	}

	if (!hasValidPublishToken(request.headers.get('Authorization'), publishToken)) {
		return json({ error: 'Unauthorized.' }, 401);
	}

	let input;
	try {
		input = parsePublishRequest(await request.json());
	} catch (error) {
		const message =
			error instanceof InvalidPublishRequestError
				? error.message
				: 'Request body must be valid JSON.';
		return json({ error: message }, 400);
	}

	const result = await prepareThought(input, {
		apiKey: process.env.OPENAI_API_KEY ?? '',
		model: process.env.OPENAI_CLEANUP_MODEL ?? 'gpt-5.4-nano',
	});

	const publishedAt = new Date();
	const path = monthFilePath(publishedAt);
	const line = serializeThought({
		id: crypto.randomUUID(),
		publishedAt,
		source: input.source,
		text: result.text,
	});

	try {
		const { commitUrl } = await appendGitHubLine({
			path,
			line,
			token: githubToken,
		});

		forgetCachedThoughts();

		return json(
			{
				ok: true,
				cleaned: result.cleaned,
				path,
				commitUrl,
			},
			201,
		);
	} catch (error) {
		console.error('Failed to publish thought', error);
		return json({ error: 'The thought could not be published.' }, 502);
	}
};
