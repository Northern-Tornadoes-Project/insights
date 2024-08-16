import { FormProvider, useForm } from '@conform-to/react';
import { conformZodMessage, parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { DatePickerConform } from '~/components/ui/date-picker';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Spinner } from '~/components/ui/spinner';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';

// Instead of sharing a schema, prepare a schema creator
function createSchema(options?: {
	isFolderNameUnique: (folderName: string) => Promise<boolean>;
	isNameUnique: (name: string) => Promise<boolean>;
}) {
	return z.object({
		name: z
			.string()
			.min(3, {
				message: 'Name must be at least 3 characters.'
			})
			.max(255, {
				message: 'Name must be between 3 and 255 characters.'
			})
			.pipe(
				z.string().superRefine((name, ctx) => {
					// This makes Conform to fallback to server validation
					// by indicating that the validation is not defined
					if (typeof options?.isNameUnique !== 'function') {
						ctx.addIssue({
							code: 'custom',
							message: conformZodMessage.VALIDATION_UNDEFINED,
							fatal: true
						});
						return;
					}

					// If it reaches here, then it must be validating on the server
					// Return the result as a promise so Zod knows it's async instead
					return options.isNameUnique(name).then((isUnique) => {
						if (!isUnique) {
							ctx.addIssue({
								code: 'custom',
								message: 'Name is already used'
							});
						}
					});
				})
			),
		folderName: z
			.string()
			.min(3, {
				message: 'Folder name must be at least 3 characters.'
			})
			.max(255, {
				message: 'Folder name must be between 3 and 255 characters.'
			})
			.regex(/^[a-z0-9_-]+$/, {
				message: 'Must only contain lowercase letters, numbers, hyphens, and underscores.'
			})
			.pipe(
				z.string().superRefine((folderName, ctx) => {
					// This makes Conform to fallback to server validation
					// by indicating that the validation is not defined
					if (typeof options?.isFolderNameUnique !== 'function') {
						ctx.addIssue({
							code: 'custom',
							message: conformZodMessage.VALIDATION_UNDEFINED,
							fatal: true
						});
						return;
					}

					// If it reaches here, then it must be validating on the server
					// Return the result as a promise so Zod knows it's async instead
					return options.isFolderNameUnique(folderName).then((isUnique) => {
						if (!isUnique) {
							ctx.addIssue({
								code: 'custom',
								message: 'Folder name is already used'
							});
						}
					});
				})
			),
		eventDate: z.date(),
		captureDate: z.date()
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	await protectedRoute(request);
	return null;
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await protectedRoute(request);
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
		schema: createSchema({
			async isFolderNameUnique(folderName) {
				const scan = await db.query.scans.findFirst({
					where: eq(scans.folderName, folderName)
				});
				return !scan;
			},
			async isNameUnique(name) {
				const scan = await db.query.scans.findFirst({
					where: eq(scans.name, name)
				});
				return !scan;
			}
		}),
		async: true
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const { name, folderName, eventDate, captureDate } = submission.value;

	const scan = await db
		.insert(scans)
		.values({
			name,
			folderName,
			eventDate,
			captureDate,
			createdBy: userId,
			updatedBy: userId
		})
		.returning({
			id: scans.id,
			folderName: scans.folderName
		});

	if (scan.length !== 1) {
		throw new Error('Error creating path.');
	}

	// Create folder in the SCAN_DIRECTORY
	await mkdir(`${process.env.SCAN_DIRECTORY}/${scan[0].folderName}`, {
		recursive: true
	});

	return redirect(`/lidar/new/${scan[0].id}/scan`);
}

export default function () {
	const navigation = useNavigation();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createSchema() });
		}
	});

	return (
		<main className="flex h-full items-center justify-center">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>New Scan</CardTitle>
					<CardDescription>
						Create a new LiDAR scan to start uploading the related files.
					</CardDescription>
				</CardHeader>
				<FormProvider context={form.context}>
					<Form method="post" id={form.id} onSubmit={form.onSubmit}>
						<CardContent className="grid gap-2">
							<div>
								<Label htmlFor={fields.name.id}>Name</Label>
								<Input
									key={fields.name.key}
									name={fields.name.name}
									defaultValue={fields.name.initialValue}
									disabled={navigation.state === 'submitting'}
									placeholder="Name"
								/>
								<p className="text-sm text-primary/60">{fields.name.errors}</p>
							</div>
							<div>
								<Label htmlFor={fields.folderName.id}>Folder Name</Label>
								<Input
									key={fields.folderName.key}
									name={fields.folderName.name}
									defaultValue={fields.folderName.initialValue}
									disabled={navigation.state === 'submitting'}
									placeholder="Folder Name"
								/>
								<p className="text-sm text-primary/60">{fields.folderName.errors}</p>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<Label htmlFor={fields.eventDate.id}>Event Date</Label>
									<DatePickerConform
										meta={fields.eventDate}
										disabled={navigation.state === 'submitting'}
									/>
									<p className="text-sm text-primary/60">{fields.eventDate.errors}</p>
								</div>
								<div>
									<Label htmlFor={fields.captureDate.id}>Capture Date</Label>
									<DatePickerConform
										meta={fields.captureDate}
										disabled={navigation.state === 'submitting'}
									/>
									<p className="text-sm text-primary/60">{fields.captureDate.errors}</p>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button type="submit" disabled={navigation.state === 'submitting'}>
								{navigation.state === 'submitting' && (
									<Spinner className="mr-2 fill-primary" size={4} />
								)}
								Next
							</Button>
						</CardFooter>
					</Form>
				</FormProvider>
			</Card>
		</main>
	);
}
