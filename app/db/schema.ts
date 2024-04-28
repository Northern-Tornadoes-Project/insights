import { SessionData } from '@remix-run/node';
import { json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
	id: serial('id').primaryKey(),
	data: json('data').$type<
		Partial<
			SessionData & {
				[x: `__flash_${string}__`]: unknown;
			}
		>
	>(),
	expires: timestamp('expires')
});

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: text('email').unique().notNull(),
	name: text('name'),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updateAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date())
});

export const validEmails = pgTable('valid_emails', {
	email: text('email').primaryKey()
});
