import { createCookieSessionStorage, createSessionStorage } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { createThemeSessionResolver } from 'remix-themes';
import { sessions } from '~/db/schema';
import { env } from '~/env.server';
import { db } from '../db/db.server';

const isProduction = process.env.NODE_ENV === 'production';

const themeSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'theme',
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secrets: [env.COOKIE_SECRET],
		// Set domain and secure only if in production
		...(isProduction && env.PUBLIC_URL ? { domain: env.PUBLIC_URL, secure: true } : {})
	}
});

export const authSessionResolver = createSessionStorage({
	cookie: {
		name: '__session',
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secrets: [env.COOKIE_SECRET],
		// Set domain and secure only if in production
		...(isProduction && env.PUBLIC_URL ? { domain: env.PUBLIC_URL, secure: true } : {})
	},
	async createData(data, expires) {
		const session = await db
			.insert(sessions)
			.values({
				data,
				expires
			})
			.returning();

		if (session.length !== 1) {
			throw new Error('Failed to create session');
		}

		return session[0].id.toString();
	},
	async readData(id) {
		const session = await db.query.sessions.findFirst({
			columns: {
				data: true
			},
			where: eq(sessions.id, parseInt(id, 10))
		});

		if (!session) {
			return null;
		}

		return session.data;
	},
	async updateData(id, data, expires) {
		await db
			.update(sessions)
			.set({
				data,
				expires
			})
			.where(eq(sessions.id, parseInt(id, 10)));
	},
	async deleteData(id) {
		await db.delete(sessions).where(eq(sessions.id, parseInt(id, 10)));
	}
});

export const themeSessionResolver = createThemeSessionResolver(themeSessionStorage);
