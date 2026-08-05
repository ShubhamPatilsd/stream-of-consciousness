import { describe, expect, it } from 'vitest';
import {
	getPageCount,
	paginateThoughts,
	sortThoughtsNewestFirst,
} from './thought-utils';

function thought(publishedAt: string) {
	return { publishedAt: new Date(publishedAt) };
}

describe('thought feed helpers', () => {
	it('sorts thoughts newest first without changing the input', () => {
		const oldest = thought('2026-08-01T12:00:00Z');
		const newest = thought('2026-08-03T12:00:00Z');
		const middle = thought('2026-08-02T12:00:00Z');
		const input = [oldest, newest, middle];

		expect(sortThoughtsNewestFirst(input)).toEqual([newest, middle, oldest]);
		expect(input).toEqual([oldest, newest, middle]);
	});

	it('returns the requested page without overlap', () => {
		expect(paginateThoughts([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
	});

	it('always exposes at least one page', () => {
		expect(getPageCount(0)).toBe(1);
		expect(getPageCount(101, 50)).toBe(3);
	});
});
