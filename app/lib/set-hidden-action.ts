import { ActionFunctionArgs } from '@remix-run/node';
import { getTableColumns, sql } from 'drizzle-orm';
import { AnyPgColumn, AnyPgTable, PgBoolean } from 'drizzle-orm/pg-core';
import { db } from '~/db/db.server';
import { protectedRoute } from './auth.server';

export function createHiddenAction<
	T extends AnyPgTable & {
		id: AnyPgColumn;
		hidden: AnyPgColumn;
	}
>(table: T) {
	const columns = getTableColumns(table);

	if (!columns['hidden'] || !(columns['hidden'] instanceof PgBoolean))
		throw new Error('The table must have a "hidden" column');

	return async function ({ request }: ActionFunctionArgs) {
		await protectedRoute(request);

		const url = new URL(request.url);
		const id = url.searchParams.get('id');
		const hidden = url.searchParams.get('hidden');

		if (!id || !hidden)
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request'
			});

		if (hidden !== 'true' && hidden !== 'false')
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request'
			});

		const hiddenValue = hidden === 'true';

		try {
			// Use the `sql` tag to safely interpolate the table name and column names
			await db.execute(sql`update ${table} set hidden = ${hiddenValue} where id = ${id}`);
		} catch (error) {
			console.error(error);
			return new Response(null, {
				status: 500,
				statusText: 'Internal Server Error'
			});
		}

		return new Response(null, {
			status: 200,
			statusText: 'OK'
		});
	};
}
