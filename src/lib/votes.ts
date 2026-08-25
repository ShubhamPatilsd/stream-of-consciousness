import { readGitHubFile } from './publishing/github';

/** Votes live in one ndjson file next to the thoughts: one appended line per
 * vote, so recording a vote is the same cheap write as publishing a thought.
 * The name does not match the month-file pattern, so the feed reader skips it. */
export const VOTES_FILE_PATH = 'thoughts/votes.ndjson';

export type VoteDirection = 'up' | 'down';

export interface VoteCounts {
	up: number;
	down: number;
}

export function serializeVote(thoughtId: string, vote: VoteDirection): string {
	return JSON.stringify({
		thoughtId,
		vote,
		votedAt: new Date().toISOString(),
	});
}

/** Malformed lines are skipped rather than thrown, matching the feed parser. */
export function tallyVoteFile(contents: string): Map<string, VoteCounts> {
	const counts = new Map<string, VoteCounts>();

	for (const line of contents.split('\n')) {
		if (!line.trim()) {
			continue;
		}

		let value: unknown;
		try {
			value = JSON.parse(line);
		} catch {
			continue;
		}

		if (!value || typeof value !== 'object') {
			continue;
		}

		const { thoughtId, vote } = value as Record<string, unknown>;
		if (typeof thoughtId !== 'string' || (vote !== 'up' && vote !== 'down')) {
			continue;
		}

		const tally = counts.get(thoughtId) ?? { up: 0, down: 0 };
		tally[vote] += 1;
		counts.set(thoughtId, tally);
	}

	return counts;
}

async function readVoteFileFromDisk(): Promise<string> {
	const { readFile } = await import('node:fs/promises');
	const { join } = await import('node:path');

	try {
		return await readFile(join(process.cwd(), VOTES_FILE_PATH), 'utf8');
	} catch {
		return '';
	}
}

/**
 * Reads from GitHub on every request, like the thoughts themselves, so a vote
 * is visible as soon as its commit lands. Without a token — local development —
 * it falls back to the working copy.
 */
export async function getVoteCounts(): Promise<Map<string, VoteCounts>> {
	const token = process.env.GITHUB_TOKEN ?? '';
	const contents = token
		? ((await readGitHubFile({ path: VOTES_FILE_PATH, token }))?.content ?? '')
		: await readVoteFileFromDisk();

	return tallyVoteFile(contents);
}
