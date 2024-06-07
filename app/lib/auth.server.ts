import { Authenticator } from 'remix-auth';
import { authSessionResolver } from './sessions.server';
import { users, validEmails } from '~/db/schema';
import { TOTPStrategy } from 'remix-auth-totp';
import { env } from '~/env.server';
import { sendCode } from './email.server';
import { db } from '~/db/db.server';
import { eq } from 'drizzle-orm';

export const authenticator = new Authenticator<typeof users.$inferSelect.id>(authSessionResolver);

authenticator.use(
	new TOTPStrategy(
		{
			validateEmail: async (email) => {
				// Check if email is in the valid_emails table
				const validEmail = await db.query.validEmails.findFirst({
					where: eq(validEmails.email, email)
				});

				if (validEmail) {
					return true;
				}

				return false;
			},
			maxAge: 60 * 60 * 24,
			magicLinkPath: '/auth/magic-link',
			secret: env.AUTH_SECRET,
			customErrors: {
				invalidEmail: 'Invalid email. Please try another.'
			},
			sendTOTP: async ({ email, code, magicLink }) => {
				if (process.env.NODE_ENV === 'development') {
					console.log('[Dev] TOTP Code:', code);
				}

				await sendCode({
					to: email,
					code,
					magicLink
				});
			}
		},
		async ({ email }) => {
			let user = await db.query.users.findFirst({
				where: eq(users.email, email)
			});

			if (!user) {
				const insert = await db.insert(users).values({ email }).returning();

				if (insert.length !== 1) {
					throw new Error('Failed to create user');
				}

				user = insert[0];
			}

			return user.id;
		}
	)
);

export const protectedRoute = async (request: Request) => {
	const userId = await authenticator.isAuthenticated(request);

	if (!userId) {
		throw new Response("Unauthorized", {
			status: 401
		});
	}

	return userId;
};
