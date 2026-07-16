import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import worker from '../../../../scripts/sites-worker.js';

export const prerender = false;

const unavailableAssets = {
	fetch: async () => new Response(null, { status: 404 })
};

const handle: RequestHandler = async ({ request }) => {
	return worker.fetch(request, { ...env, ASSETS: unavailableAssets });
};

export {
	handle as DELETE,
	handle as GET,
	handle as OPTIONS,
	handle as PATCH,
	handle as POST,
	handle as PUT
};
