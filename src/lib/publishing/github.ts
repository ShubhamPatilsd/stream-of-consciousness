const GITHUB_OWNER = 'ShubhamPatilsd';
const GITHUB_REPOSITORY = 'stream-of-consciousness';
const GITHUB_BRANCH = 'main';

interface CreateGitHubFileOptions {
	path: string;
	content: string;
	token: string;
	fetch?: typeof globalThis.fetch;
}

interface GitHubFileResponse {
	commit?: {
		html_url?: string;
	};
}

export class GitHubPublishError extends Error {}

export async function createGitHubFile({
	path,
	content,
	token,
	fetch: fetchImpl = globalThis.fetch,
}: CreateGitHubFileOptions): Promise<{ commitUrl?: string }> {
	const response = await fetchImpl(
		`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents/${path}`,
		{
			method: 'PUT',
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				'X-GitHub-Api-Version': '2026-03-10',
			},
			body: JSON.stringify({
				message: 'publish thought',
				content: Buffer.from(content, 'utf8').toString('base64'),
				branch: GITHUB_BRANCH,
			}),
		},
	);

	if (!response.ok) {
		const message = await response.text();
		throw new GitHubPublishError(
			`GitHub rejected the thought (${response.status}): ${message.slice(0, 300)}`,
		);
	}

	const result = (await response.json()) as GitHubFileResponse;
	return { commitUrl: result.commit?.html_url };
}
