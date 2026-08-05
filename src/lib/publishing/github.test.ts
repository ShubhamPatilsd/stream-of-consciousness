import { describe, expect, it, vi } from 'vitest';
import { createGitHubFile, GitHubPublishError } from './github';

describe('GitHub publishing', () => {
	it('creates a Markdown file on the main branch', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			Response.json({
				commit: { html_url: 'https://github.com/example/commit/123' },
			}),
		);

		await expect(
			createGitHubFile({
				path: 'src/content/thoughts/thought.md',
				content: 'hello',
				token: 'github-token',
				fetch,
			}),
		).resolves.toEqual({
			commitUrl: 'https://github.com/example/commit/123',
		});

		const [url, init] = fetch.mock.calls[0];
		expect(url).toContain(
			'/repos/ShubhamPatilsd/stream-of-consciousness/contents/src/content/thoughts/thought.md',
		);
		expect(init?.method).toBe('PUT');
		expect(JSON.parse(String(init?.body))).toMatchObject({
			message: 'publish thought',
			content: Buffer.from('hello').toString('base64'),
			branch: 'main',
		});
	});

	it('surfaces GitHub failures without pretending to publish', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response('permission denied', { status: 403 }));

		await expect(
			createGitHubFile({
				path: 'src/content/thoughts/thought.md',
				content: 'hello',
				token: 'bad-token',
				fetch,
			}),
		).rejects.toBeInstanceOf(GitHubPublishError);
	});
});
