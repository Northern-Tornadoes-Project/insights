import { useForm } from '@conform-to/react';
import { conformZodMessage, parseWithZod } from '@conform-to/zod';
import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { LucideArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { db } from '~/db/db.server';
import { users, validEmails } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';
import { sendInviteNotification } from '~/lib/email.server';

// Instead of sharing a schema, prepare a schema creator
function createSchema(options?: { isEmailUnique: (email: string) => Promise<boolean> }) {
	return z.object({
		email: z
			.string()
			.email()
			.pipe(
				z.string().superRefine(async (email, ctx) => {
					// This makes Conform to fallback to server validation
					// by indicating that the validation is not defined
					if (typeof options?.isEmailUnique !== 'function') {
						ctx.addIssue({
							code: 'custom',
							message: conformZodMessage.VALIDATION_UNDEFINED,
							fatal: true
						});
						return;
					}

					// If it reaches here, then it must be validating on the server
					// Return the result as a promise so Zod knows it's async instead
					return options.isEmailUnique(email).then((isUnique) => {
						if (!isUnique) {
							ctx.addIssue({
								code: 'custom',
								message: 'Email is already used'
							});
						}
					});
				})
			)
	});
}

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - New Users' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await protectedRoute(request);

	const user = await db.query.users.findFirst({
		where: eq(users.id, id)
	});

	if (!user) {
		throw new Response(null, {
			status: 401,
			statusText: 'Unauthorized'
		});
	}

	return json({
		disabledEmails: await db.query.validEmails.findMany({
			where: and(eq(validEmails.enabled, false), eq(validEmails.email, user.email))
		})
	});
}

export async function action({ request }: LoaderFunctionArgs) {
	await protectedRoute(request);

	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
		schema: createSchema({
			isEmailUnique: async (email) => {
				const existingEmail = await db.query.validEmails.findFirst({
					where: eq(validEmails.email, email)
				});

				return !existingEmail;
			}
		}),
		async: true
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	// Add email to verified emails
	const email = submission.value.email;

	const insert = await db.insert(validEmails).values({ email, enabled: true }).returning();

	if (insert.length !== 1) {
		throw new Error('Failed to insert email');
	}

	if (process.env.NODE_ENV === 'production') {
		try {
			await sendInviteNotification({ to: email });
		} catch (error) {
			console.error(error);
		}
	}

	return null;
}

export default function () {
	const { disabledEmails } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createSchema() });
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput'
	});

	useEffect(() => {
		if (lastResult === null) {
			toast.success('Email added successfully.');
			form.reset();
		}
	}, [lastResult]);

	return (
		<main className="flex w-full flex-col items-center gap-4">
			<Link to="/" className="absolute left-0 top-0 m-4">
				<Button variant="link" className="items-center gap-2">
					<LucideArrowLeft /> Back
				</Button>
			</Link>
			<Card className="w-full md:w-3/4 xl:w-3/5">
				<CardHeader>
					<CardTitle>Invite</CardTitle>
					<CardDescription>Invite new users to the platform.</CardDescription>
				</CardHeader>
				<Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
					<CardContent>
						<Label htmlFor="email">Email</Label>
						<Input
							type="email"
							id="email"
							placeholder="Email..."
							key={fields.email.key}
							name={fields.email.name}
							defaultValue={fields.email.initialValue}
						/>
						<p className="text-sm text-primary/60">{fields.email.errors}</p>
					</CardContent>
					<CardFooter>
						<Button type="submit">Invite</Button>
					</CardFooter>
				</Form>
			</Card>
			{/* TODO: Determine if requests feature is necessary */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Requests</CardTitle>
					<CardDescription>Accept users who requested access.</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={disabledEmails.map((email) => ({
							...email,
							enabled: email.enabled ?? false,
							createdAt: new Date(email.createdAt),
							updatedAt: new Date(email.updatedAt)
						}))}
					/>
				</CardContent>
			</Card> */}
		</main>
	);
}
