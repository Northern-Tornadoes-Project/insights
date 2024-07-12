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
import { paths } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';

// Instead of sharing a schema, prepare a schema creator
function createSchema(options?: { isFolderNameUnique: (folderName: string) => Promise<boolean> }) {
	return z.object({
		name: z
			.string()
			.min(3, {
				message: 'Name must be at least 3 characters.'
			})
			.max(255, {
				message: 'Name must be between 3 and 255 characters.'
			}),
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
		eventDate: z.date()
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
				const path = await db.query.paths.findFirst({
					where: eq(paths.folderName, folderName)
				});
				return !path;
			}
		}),
		async: true
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const { name, folderName, eventDate } = submission.value;

	const path = await db
		.insert(paths)
		.values({
			name,
			folderName,
			eventDate,
			createdBy: userId,
			updatedBy: userId
		})
		.returning({
			id: paths.id,
			folderName: paths.folderName
		});

	if (path.length != 1) {
		throw new Error('Error creating path.');
	}

	// Create folder in the PATH_DIRECTORY
	await mkdir(`${process.env.PATH_DIRECTORY}/${path[0].folderName}`, {
		recursive: true
	});

	return redirect(`/360/new/${path[0].id}/framepos`);
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
		<main className="flex justify-center items-center h-full">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>New Path</CardTitle>
					<CardDescription>Create a new path to start uploading images.</CardDescription>
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
								<p className="text-primary/60 text-sm">{fields.name.errors}</p>
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
								<p className="text-primary/60 text-sm">{fields.folderName.errors}</p>
							</div>
							<div>
								<Label htmlFor={fields.eventDate.id}>Event Date</Label>
								<DatePickerConform
									meta={fields.eventDate}
									disabled={navigation.state === 'submitting'}
								/>
								<p className="text-primary/60 text-sm">{fields.eventDate.errors}</p>
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
