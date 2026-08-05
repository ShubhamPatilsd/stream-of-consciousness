import { describe, expect, it, vi } from 'vitest';
import {
	appendGitHubLine,
	GitHubPublishError,
	listGitHubDirectory,
	readGitHubFile,
} from './github';

function fileResponse(content: string, sha: string) {
	return Response.json({
		content: Buffer.from(content, 'utf8').toString('base64'),
		encoding: 'base64',
		sha,
	});
}

function commitResponse() {
	return Response.json({
		commit: { html_url: 'https://github.com/example/commit/123' },
	});
}

describe('reading thought files', () => {
	it('decodes file contents', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(fileResponse('{"text":"hi"}\n', 'sha-1'));

		await expect(
			readGitHubFile({ path: 'thoughts/2026-08.ndjson', token: 't', fetch }),
		).resolves.toEqual({ content: '{"text":"hi"}\n', sha: 'sha-1' });

		expect(String(fetch.mock.calls[0][0])).toContain(
			'/repos/ShubhamPatilsd/stream-of-consciousness/contents/thoughts/2026-08.ndjson?ref=main',
		);
	});

	it('treats a missing file as empty rather than an error', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response('missing', { status: 404 }));

		await expect(
			readGitHubFile({ path: 'thoughts/2026-09.ndjson', token: 't', fetch }),
		).resolves.toBeNull();
		await expect(
			listGitHubDirectory({ path: 'thoughts', token: 't', fetch }),
		).resolves.toEqual([]);
	});

	it('refuses to render a file too large to read inline', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(Response.json({ content: '', encoding: 'none' }));

		await expect(
			readGitHubFile({ path: 'thoughts/2026-08.ndjson', token: 't', fetch }),
		).rejects.toBeInstanceOf(GitHubPublishError);
	});

	it('lists only files in the thoughts directory', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			Response.json([
				{ name: '2026-08.ndjson', type: 'file' },
				{ name: 'archive', type: 'dir' },
			]),
		);

		await expect(
			listGitHubDirectory({ path: 'thoughts', token: 't', fetch }),
		).resolves.toEqual(['2026-08.ndjson']);
	});
});

describe('appending a thought', () => {
	it('appends to an existing file against its current SHA', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(fileResponse('first\n', 'sha-1'))
			.mockResolvedValueOnce(commitResponse());

		await expect(
			appendGitHubLine({
				path: 'thoughts/2026-08.ndjson',
				line: 'second',
				token: 't',
				fetch,
			}),
		).resolves.toEqual({ commitUrl: 'https://github.com/example/commit/123' });

		const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
		expect(Buffer.from(body.content, 'base64').toString('utf8')).toBe(
			'first\nsecond\n',
		);
		expect(body).toMatchObject({ sha: 'sha-1', branch: 'main' });
	});

	it('adds the missing newline when the file does not end with one', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(fileResponse('first', 'sha-1'))
			.mockResolvedValueOnce(commitResponse());

		await appendGitHubLine({
			path: 'thoughts/2026-08.ndjson',
			line: 'second',
			token: 't',
			fetch,
		});

		const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
		expect(Buffer.from(body.content, 'base64').toString('utf8')).toBe(
			'first\nsecond\n',
		);
	});

	it('creates the file without a SHA when the month is new', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(new Response('missing', { status: 404 }))
			.mockResolvedValueOnce(commitResponse());

		await appendGitHubLine({
			path: 'thoughts/2026-09.ndjson',
			line: 'first',
			token: 't',
			fetch,
		});

		const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
		expect(body.sha).toBeUndefined();
		expect(Buffer.from(body.content, 'base64').toString('utf8')).toBe('first\n');
	});

	it('retries against the newer file when a concurrent publish wins the race', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(fileResponse('first\n', 'sha-1'))
			.mockResolvedValueOnce(new Response('conflict', { status: 409 }))
			.mockResolvedValueOnce(fileResponse('first\nother\n', 'sha-2'))
			.mockResolvedValueOnce(commitResponse());

		await expect(
			appendGitHubLine({
				path: 'thoughts/2026-08.ndjson',
				line: 'mine',
				token: 't',
				fetch,
			}),
		).resolves.toEqual({ commitUrl: 'https://github.com/example/commit/123' });

		// The thought that won the race is preserved, not overwritten.
		const body = JSON.parse(String(fetch.mock.calls[3][1]?.body));
		expect(Buffer.from(body.content, 'base64').toString('utf8')).toBe(
			'first\nother\nmine\n',
		);
		expect(body.sha).toBe('sha-2');
	});

	it('surfaces non-conflict failures without pretending to publish', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(fileResponse('first\n', 'sha-1'))
			.mockResolvedValueOnce(new Response('permission denied', { status: 403 }));

		await expect(
			appendGitHubLine({
				path: 'thoughts/2026-08.ndjson',
				line: 'second',
				token: 'bad-token',
				fetch,
			}),
		).rejects.toBeInstanceOf(GitHubPublishError);
	});

	it('gives up after repeated conflicts instead of looping forever', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockImplementation(async (_url, init) =>
				init?.method === 'PUT'
					? new Response('conflict', { status: 409 })
					: fileResponse('first\n', 'sha-1'),
			);

		await expect(
			appendGitHubLine({
				path: 'thoughts/2026-08.ndjson',
				line: 'second',
				token: 't',
				fetch,
			}),
		).rejects.toBeInstanceOf(GitHubPublishError);
	});
});
