import { describe, expect, it } from 'vitest';
import {
	isMonthFileName,
	monthFilePath,
	parseThoughtFile,
	serializeThought,
} from './thought-record';

const publishedAt = new Date('2026-08-05T06:15:30.123Z');

describe('thought serialization', () => {
	it('round-trips a thought through one NDJSON line', () => {
		const thought = {
			id: 'abc',
			publishedAt,
			source: 'voice' as const,
			text: 'Line one\nLine two',
		};

		const line = serializeThought(thought);
		expect(line).not.toContain('\n');
		expect(parseThoughtFile(`${line}\n`)).toEqual([thought]);
	});

	it('keeps text that would break a delimiter-based format intact', () => {
		const text = '---\n<script>alert("no")</script> & "quotes"';
		const line = serializeThought({
			id: 'abc',
			publishedAt,
			source: 'text',
			text,
		});

		expect(parseThoughtFile(`${line}\n`)[0].text).toBe(text);
	});

	it('skips malformed lines instead of failing the whole feed', () => {
		const good = serializeThought({
			id: 'abc',
			publishedAt,
			source: 'text',
			text: 'kept',
		});

		const contents = [
			'not json at all',
			'{"text":"no date"}',
			'{"publishedAt":"nonsense","text":"bad date"}',
			'',
			good,
		].join('\n');

		expect(parseThoughtFile(contents).map((thought) => thought.text)).toEqual([
			'kept',
		]);
	});
});

describe('month files', () => {
	it('groups thoughts by UTC month', () => {
		expect(monthFilePath(publishedAt)).toBe('thoughts/2026-08.ndjson');
		expect(monthFilePath(new Date('2026-12-31T23:59:59Z'))).toBe(
			'thoughts/2026-12.ndjson',
		);
	});

	it('recognizes only month files', () => {
		expect(isMonthFileName('2026-08.ndjson')).toBe(true);
		expect(isMonthFileName('README.md')).toBe(false);
		expect(isMonthFileName('2026-8.ndjson')).toBe(false);
	});
});
