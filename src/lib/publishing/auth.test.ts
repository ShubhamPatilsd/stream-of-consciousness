import { describe, expect, it } from 'vitest';
import {
	createPublishSession,
	hasValidPublishSession,
	hasValidPublishToken,
} from './auth';

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

	it('creates and validates a persistent publishing session', () => {
		const session = createPublishSession('secret-value');

		expect(session).not.toContain('secret-value');
		expect(hasValidPublishSession(session, 'secret-value')).toBe(true);
		expect(hasValidPublishSession(session, 'different-value')).toBe(false);
		expect(hasValidPublishSession(undefined, 'secret-value')).toBe(false);
	});

	it('does not create a session without a configured token', () => {
		expect(createPublishSession('')).toBe('');
		expect(hasValidPublishSession('', '')).toBe(false);
	});
});
