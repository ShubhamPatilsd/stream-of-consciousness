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
 * Reads from GitHub on every request so a publish is visible immediately.
 * Nothing is memoized: a cache here would live in one serverless instance
 * while the publish that should invalidate it runs in another.
 *
 * Without a token — local development — it falls back to the working copy.
 */
export async function getSortedThoughts(): Promise<ThoughtRecord[]> {
	const token = process.env.GITHUB_TOKEN ?? '';
	const files = token
		? await readMonthFilesFromGitHub(token)
		: await readMonthFilesFromDisk();

	return sortThoughtsNewestFirst(files.flatMap(parseThoughtFile));
}
