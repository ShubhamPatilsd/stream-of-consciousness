import { describe, expect, it } from 'vitest';
import {
	InvalidPublishRequestError,
	MAX_THOUGHT_LENGTH,
	parsePublishRequest,
} from './validation';

describe('publish request validation', () => {
	it('preserves typed text while normalizing line endings', () => {
		expect(
			parsePublishRequest({
				text: '  first line\r\nsecond line  ',
				source: 'text',
			}),
		).toEqual({
			text: '  first line\nsecond line  ',
			source: 'text',
		});
	});

	it('rejects blank, oversized, and unknown-source input', () => {
		expect(() => parsePublishRequest({ text: '   ', source: 'text' })).toThrow(
			InvalidPublishRequestError,
		);
		expect(() =>
			parsePublishRequest({
				text: 'x'.repeat(MAX_THOUGHT_LENGTH + 1),
				source: 'text',
			}),
		).toThrow(InvalidPublishRequestError);
		expect(() => parsePublishRequest({ text: 'hello', source: 'other' })).toThrow(
			InvalidPublishRequestError,
		);
	});
});
