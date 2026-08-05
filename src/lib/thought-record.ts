import type { ThoughtSource } from './publishing/validation';

/** Thoughts live in `thoughts/YYYY-MM.ndjson`: one JSON object per line, so a
 * publish is a single appended line and a month renders in one fetch. */
export const THOUGHTS_DIRECTORY = 'thoughts';

const MONTH_FILE_PATTERN = /^\d{4}-\d{2}\.ndjson$/;

export interface ThoughtRecord {
	id: string;
	publishedAt: Date;
	source: ThoughtSource;
	text: string;
}

export function monthFileName(publishedAt: Date): string {
	const year = publishedAt.getUTCFullYear();
	const month = String(publishedAt.getUTCMonth() + 1).padStart(2, '0');
	return `${year}-${month}.ndjson`;
}

export function monthFilePath(publishedAt: Date): string {
	return `${THOUGHTS_DIRECTORY}/${monthFileName(publishedAt)}`;
}

export function isMonthFileName(name: string): boolean {
	return MONTH_FILE_PATTERN.test(name);
}

export function serializeThought(thought: ThoughtRecord): string {
	return JSON.stringify({
		id: thought.id,
		publishedAt: thought.publishedAt.toISOString(),
		source: thought.source,
		text: thought.text,
	});
}

/** Malformed lines are skipped rather than thrown: one bad line should not
 * take down the whole feed. */
export function parseThoughtFile(contents: string): ThoughtRecord[] {
	const thoughts: ThoughtRecord[] = [];

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

		const { id, publishedAt, source, text } = value as Record<string, unknown>;
		if (typeof text !== 'string' || typeof publishedAt !== 'string') {
			continue;
		}

		const date = new Date(publishedAt);
		if (Number.isNaN(date.getTime())) {
			continue;
		}

		thoughts.push({
			id: typeof id === 'string' ? id : publishedAt,
			publishedAt: date,
			source: source === 'voice' ? 'voice' : 'text',
			text,
		});
	}

	return thoughts;
}
