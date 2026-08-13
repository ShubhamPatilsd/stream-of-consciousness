import type { APIRoute } from 'astro';
import {
	createPublishSession,
	hasValidPublishToken,
	PUBLISH_SESSION_COOKIE,
} from '../../lib/publishing/auth';

export const prerender = false;

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function redirect(location: string): Response {
	return new Response(null, {
		status: 303,
		headers: {
			'Cache-Control': 'no-store',
			Location: location,
		},
	});
}

export const POST: APIRoute = async ({ cookies, request }) => {
	const form = await request.formData();

	if (form.get('action') === 'logout') {
		cookies.delete(PUBLISH_SESSION_COOKIE, { path: '/' });
		return redirect('/write/login');
	}

	const publishToken = process.env.PUBLISH_TOKEN ?? '';
	const suppliedToken = form.get('publish-token');

	if (
		typeof suppliedToken !== 'string' ||
		!hasValidPublishToken(`Bearer ${suppliedToken}`, publishToken)
	) {
		return redirect('/write/login?error=invalid');
	}

	cookies.set(PUBLISH_SESSION_COOKIE, createPublishSession(publishToken), {
		httpOnly: true,
		maxAge: ONE_YEAR_IN_SECONDS,
		path: '/',
		sameSite: 'strict',
		secure: import.meta.env.PROD,
	});

	return redirect('/write');
};
