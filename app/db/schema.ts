import { SessionData } from '@remix-run/node';
import {
	json,
	pgTable,
	serial,
	text,
	timestamp,
	integer,
	decimal,
	boolean,
	pgEnum,
	uuid
} from 'drizzle-orm/pg-core';

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
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date())
});

export const validEmails = pgTable('valid_emails', {
	email: text('email').primaryKey()
});

export const imageSource = pgEnum('image_source', ['NTP', 'Google', 'Unknown']);

export const paths = pgTable('paths', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').unique().notNull(),
	folder_name: text('folder_name').unique().notNull(),
	event_date: timestamp('event_date').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
	createdBy: serial('created_by')
		.references(() => users.id)
		.notNull(),
	updatedBy: serial('updated_by')
		.references(() => users.id)
		.notNull()
});

export const capture = pgTable('captures', {
	id: uuid('id').defaultRandom().primaryKey(),
	file_name: text('file_name').notNull(),
	source: imageSource('source').default('Unknown').notNull(),
	size: integer('size').notNull(),
	takenAt: timestamp('created_at').defaultNow().notNull(),
	uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
	lng: decimal('lng').notNull(),
	lat: decimal('lat').notNull(),
	altitude: decimal('altitude'),
	distance: decimal('distance'),
	heading: decimal('heading'),
	pitch: decimal('pitch'),
	roll: decimal('roll'),
	track: decimal('track')
});

export const pathSegment = pgTable('path_segments', {
	id: uuid('id').defaultRandom().primaryKey(),
	index: integer('index').notNull(),
	pathId: uuid('path_id')
		.references(() => paths.id)
		.notNull(),
	captureId: uuid('capture_id')
		.references(() => capture.id)
		.notNull(),
	streetViewId: uuid('street_view_id').references(() => capture.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updateAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
	hidden: boolean('hidden').default(false).notNull()
});
