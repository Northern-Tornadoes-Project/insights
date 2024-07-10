import { SessionData } from '@remix-run/node';
import { relations } from 'drizzle-orm';
import {
	boolean,
	decimal,
	integer,
	json,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
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

export const imageSource = pgEnum('image_source', ['ntp', 'google', 'unknown']);
export const pathInitializationStatus = pgEnum('path_initialization_status', [
	'framepos',
	'uploading',
	'processing',
	'complete',
	'failed'
]);

// 360 Tables

export const paths = pgTable('paths', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').unique().notNull(),
	folderName: text('folder_name').unique().notNull(),
	eventDate: timestamp('event_date').notNull(),
	frameposData: jsonb('framepos_data').array(),
	panoramaData: jsonb('panorama_data'),
	status: pathInitializationStatus('status').default('framepos').notNull(),
	size: integer('size'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
	createdBy: integer('created_by')
		.references(() => users.id)
		.notNull(),
	updatedBy: integer('updated_by')
		.references(() => users.id)
		.notNull()
});

export const captures = pgTable('captures', {
	id: uuid('id').defaultRandom().primaryKey(),
	file_name: text('file_name').notNull(),
	source: imageSource('source').default('unknown').notNull(),
	size: integer('size').notNull(),
	takenAt: timestamp('taken_at').notNull(),
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

export const pathSegments = pgTable('path_segments', {
	id: uuid('id').defaultRandom().primaryKey(),
	index: integer('index').notNull(),
	pathId: uuid('path_id')
		.references(() => paths.id)
		.notNull(),
	captureId: uuid('capture_id')
		.references(() => captures.id)
		.notNull(),
	streetViewId: uuid('street_view_id').references(() => captures.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updateAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
	hidden: boolean('hidden').default(false).notNull()
});

// Hailgen Tables

export const hailpad = pgTable('hailpad', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('hailpad_name').notNull(),
	boxfit: decimal('boxfit').notNull(),
	adaptiveBlockSize: decimal('adaptive_block_size').notNull(),
	adaptiveC: decimal('adaptive_c').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
	createdBy: integer('created_by')
		.references(() => users.id)
		.notNull(),
	updatedBy: integer('updated_by')
		.references(() => users.id)
		.notNull(),
	hidden: boolean('hidden').default(false).notNull()
});

export const dent = pgTable('dent', {
	id: uuid('id').defaultRandom().primaryKey(),
	hailpadId: uuid('hailpad_id')
		.references(() => hailpad.id)
		.notNull(),
	majorAxis: decimal('major_axis').notNull(),
	minorAxis: decimal('minor_axis').notNull(),
	rotation: decimal('rotation'),
	centroidX: decimal('centroid_x').notNull(),
	centroidY: decimal('centroid_y').notNull()
});

// Relations

export const hailpadRelations = relations(hailpad, ({ many }) => ({
	dents: many(dent, {
		relationName: 'hailpad'
	})
}));

export const dentRelations = relations(dent, ({ one }) => ({
	hailpad: one(hailpad, {
		fields: [dent.hailpadId],
		references: [hailpad.id],
		relationName: 'hailpad'
	})
}));

export const userRelations = relations(users, ({ many }) => ({
	createdPaths: many(paths, {
		relationName: 'author'
	}),

	editedPaths: many(paths, {
		relationName: 'editor'
	})
}));

export const pathRelations = relations(paths, ({ one, many }) => ({
	author: one(users, {
		fields: [paths.createdBy],
		references: [users.id],
		relationName: 'author'
	}),
	editor: one(users, {
		fields: [paths.updatedBy],
		references: [users.id],
		relationName: 'editor'
	}),
	segments: many(pathSegments)
}));

export const segmentRelations = relations(pathSegments, ({ one }) => ({
	path: one(paths, {
		fields: [pathSegments.pathId],
		references: [paths.id],
		relationName: 'path'
	}),
	capture: one(captures, {
		fields: [pathSegments.captureId],
		references: [captures.id],
		relationName: 'ntpCaptures'
	}),
	streetView: one(captures, {
		fields: [pathSegments.streetViewId],
		references: [captures.id],
		relationName: 'googleCaptures'
	})
}));
