const GITHUB_OWNER = 'ShubhamPatilsd';
const GITHUB_REPOSITORY = 'stream-of-consciousness';
const GITHUB_BRANCH = 'main';
const API_VERSION = '2026-03-10';

const CONTENTS_ROOT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents`;

/** GitHub rejects a write whose base SHA is stale, which is how concurrent
 * publishes are detected. Retrying re-reads the file and appends again. */
const APPEND_ATTEMPTS = 4;

export class GitHubPublishError extends Error {}

type Fetch = typeof globalThis.fetch;

interface GitHubFile {
	content: string;
	sha: string;
}

interface DirectoryEntry {
	name: string;
	type: string;
}

function headers(token: string): HeadersInit {
	return {
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
		'X-GitHub-Api-Version': API_VERSION,
	};
}

async function failure(response: Response, action: string): Promise<never> {
	const body = await response.text();
	throw new GitHubPublishError(
		`GitHub rejected the ${action} (${response.status}): ${body.slice(0, 300)}`,
	);
}

/** Returns null when the file does not exist yet. */
export async function readGitHubFile({
	path,
	token,
	fetch: fetchImpl = globalThis.fetch,
}: {
	path: string;
	token: string;
	fetch?: Fetch;
}): Promise<GitHubFile | null> {
	const response = await fetchImpl(
		`${CONTENTS_ROOT}/${path}?ref=${GITHUB_BRANCH}`,
		{ headers: headers(token) },
	);

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		return failure(response, 'read');
	}

	const result = (await response.json()) as {
		content?: string;
		encoding?: string;
		sha?: string;
	};

	// Files over 1MB come back with no inline content. A month of thoughts
	// should never reach that, but silently rendering an empty feed would be
	// worse than saying so.
	if (result.encoding !== 'base64' || typeof result.content !== 'string') {
		throw new GitHubPublishError(
			`${path} is too large to read inline; it needs to be split.`,
		);
	}

	return {
		content: Buffer.from(result.content, 'base64').toString('utf8'),
		sha: result.sha ?? '',
	};
}

/** Returns the file names in a directory, or an empty list if it does not exist. */
export async function listGitHubDirectory({
	path,
	token,
	fetch: fetchImpl = globalThis.fetch,
}: {
	path: string;
	token: string;
	fetch?: Fetch;
}): Promise<string[]> {
	const response = await fetchImpl(
		`${CONTENTS_ROOT}/${path}?ref=${GITHUB_BRANCH}`,
		{ headers: headers(token) },
	);

	if (response.status === 404) {
		return [];
	}

	if (!response.ok) {
		return failure(response, 'listing');
	}

	const entries = (await response.json()) as DirectoryEntry[];
	return entries.filter((entry) => entry.type === 'file').map((entry) => entry.name);
}

/**
 * Appends a line to a file, creating it when missing. Concurrent appends are
 * resolved by retrying against the newer SHA rather than overwriting.
 */
export async function appendGitHubLine({
	path,
	line,
	token,
	message = 'publish thought',
	fetch: fetchImpl = globalThis.fetch,
}: {
	path: string;
	line: string;
	token: string;
	message?: string;
	fetch?: Fetch;
}): Promise<{ commitUrl?: string }> {
	for (let attempt = 1; attempt <= APPEND_ATTEMPTS; attempt += 1) {
		const existing = await readGitHubFile({ path, token, fetch: fetchImpl });
		const previous = existing?.content ?? '';
		const separator = !previous || previous.endsWith('\n') ? '' : '\n';
		const content = `${previous}${separator}${line}\n`;

		const response = await fetchImpl(`${CONTENTS_ROOT}/${path}`, {
			method: 'PUT',
			headers: headers(token),
			body: JSON.stringify({
				message,
				content: Buffer.from(content, 'utf8').toString('base64'),
				branch: GITHUB_BRANCH,
				...(existing ? { sha: existing.sha } : {}),
			}),
		});

		if (response.ok) {
			const result = (await response.json()) as {
				commit?: { html_url?: string };
			};
			return { commitUrl: result.commit?.html_url };
		}

		const isConflict = response.status === 409 || response.status === 422;
		if (!isConflict || attempt === APPEND_ATTEMPTS) {
			return failure(response, 'thought');
		}
	}

	throw new GitHubPublishError('Could not append the thought after retrying.');
}
