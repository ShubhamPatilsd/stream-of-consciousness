import { createHmac, timingSafeEqual } from 'node:crypto';

export const PUBLISH_SESSION_COOKIE = 'thoughts_publish_session';

const SESSION_PURPOSE = 'thoughts:publish-session:v1';

function safeEqual(left: string, right: string): boolean {
	const supplied = Buffer.from(left);
	const expected = Buffer.from(right);

	return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createPublishSession(expectedToken: string): string {
	if (!expectedToken) {
		return '';
	}

	return createHmac('sha256', expectedToken)
		.update(SESSION_PURPOSE)
		.digest('base64url');
}

export function hasValidPublishSession(
	sessionCookie: string | undefined,
	expectedToken: string,
): boolean {
	if (!sessionCookie || !expectedToken) {
		return false;
	}

	return safeEqual(sessionCookie, createPublishSession(expectedToken));
}

export function hasValidPublishToken(
	authorizationHeader: string | null,
	expectedToken: string,
): boolean {
	if (!authorizationHeader?.startsWith('Bearer ') || !expectedToken) {
		return false;
	}

	const suppliedToken = authorizationHeader.slice('Bearer '.length);
	return safeEqual(suppliedToken, expectedToken);
}
