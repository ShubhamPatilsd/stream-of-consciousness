import { listGitHubDirectory, readGitHubFile } from './publishing/github';
import {
	isMonthFileName,
	parseThoughtFile,
	THOUGHTS_DIRECTORY,
	type ThoughtRecord,
} from './thought-record';
import { sortThoughtsNewestFirst } from './thought-utils';

export {
	getPageCount,
	paginateThoughts,
	THOUGHTS_PER_PAGE,
} from './thought-utils';

/** Short in-instance memo so rendering a page does not refetch every month
 * file per request. The edge cache absorbs the rest. */
const MEMO_TTL_MS = 30_000;

let memo: { thoughts: ThoughtRecord[]; expiresAt: number } | null = null;

async function readMonthFilesFromDisk(): Promise<string[]> {
	const { readdir, readFile } = await import('node:fs/promises');
	const { join } = await import('node:path');
	const directory = join(process.cwd(), THOUGHTS_DIRECTORY);

	let names: string[];
	try {
		names = await readdir(directory);
	} catch {
		return [];
	}

	return Promise.all(
		names
			.filter(isMonthFileName)
			.map((name) => readFile(join(directory, name), 'utf8')),
	);
}

async function readMonthFilesFromGitHub(token: string): Promise<string[]> {
	const names = await listGitHubDirectory({ path: THOUGHTS_DIRECTORY, token });
	const files = await Promise.all(
		names.filter(isMonthFileName).map((name) =>
			readGitHubFile({ path: `${THOUGHTS_DIRECTORY}/${name}`, token }),
		),
	);

	return files.filter((file) => file !== null).map((file) => file.content);
}

/**
 * Reads from GitHub at request time so a publish goes live without a rebuild.
 * Without a token — local development — it falls back to the working copy.
 */
export async function getSortedThoughts(): Promise<ThoughtRecord[]> {
	if (memo && memo.expiresAt > Date.now()) {
		return memo.thoughts;
	}

	const token = process.env.GITHUB_TOKEN ?? '';
	const files = token
		? await readMonthFilesFromGitHub(token)
		: await readMonthFilesFromDisk();

	const thoughts = sortThoughtsNewestFirst(files.flatMap(parseThoughtFile));
	memo = { thoughts, expiresAt: Date.now() + MEMO_TTL_MS };

	return thoughts;
}

/** Drops the memo so a just-published thought is visible immediately. */
export function forgetCachedThoughts(): void {
	memo = null;
}
