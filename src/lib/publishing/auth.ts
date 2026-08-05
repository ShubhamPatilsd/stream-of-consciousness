import { timingSafeEqual } from 'node:crypto';

export function hasValidPublishToken(
	authorizationHeader: string | null,
	expectedToken: string,
): boolean {
	if (!authorizationHeader?.startsWith('Bearer ') || !expectedToken) {
		return false;
	}

	const suppliedToken = authorizationHeader.slice('Bearer '.length);
	const supplied = Buffer.from(suppliedToken);
	const expected = Buffer.from(expectedToken);

	return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
