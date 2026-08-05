import { describe, expect, it } from 'vitest';
import { hasValidPublishToken } from './auth';

describe('publishing authentication', () => {
	it('accepts only the exact bearer token', () => {
		expect(hasValidPublishToken('Bearer secret-value', 'secret-value')).toBe(true);
		expect(hasValidPublishToken('Bearer wrong-value', 'secret-value')).toBe(false);
		expect(hasValidPublishToken('Basic secret-value', 'secret-value')).toBe(false);
		expect(hasValidPublishToken(null, 'secret-value')).toBe(false);
	});

	it('rejects an unconfigured expected token', () => {
		expect(hasValidPublishToken('Bearer anything', '')).toBe(false);
	});
});
