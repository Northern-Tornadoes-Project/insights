import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~/db/db.server';
import { paths } from '~/db/schema';
import { env } from '~/env.server';

const schema = z.object({
	status: z.enum(['complete', 'failed'])
});

export async function action({ request, params }: ActionFunctionArgs) {
	const id = params.id;

	if (!id) {
		return new Response(null, { status: 400 });
	}

	const authHeader = request.headers.get('Authorization');

	if (!authHeader) {
		return new Response(null, { status: 401 });
	}

	if (!authHeader.startsWith('Bearer ')) {
		return new Response(null, { status: 401 });
	}

	const key = authHeader.split(' ')[1];

	// Check key
	if (key !== env.SERVICE_360_KEY) {
		return new Response(null, { status: 401 });
	}

	const submission = parseWithZod(await request.json(), {
		schema
	});

	if (submission.status !== 'success') {
		return new Response(null, { status: 400 });
	}

	const update = await db
		.update(paths)
		.set({
			status: submission.value.status
		})
		.where(eq(paths.id, id));

	if (update.rowCount !== 1) {
		return new Response(null, { status: 404 });
	}

	return new Response(null, { status: 200 });
}
