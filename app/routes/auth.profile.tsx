import { getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect
} from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { LucideArrowLeft, LucideUser } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { db } from '~/db/db.server';
import { users } from '~/db/schema';
import { authenticator } from '~/lib/auth.server';

const profileFormSchema = z.object({
	name: z.string().min(3).max(255),
	image_url: z.string().url().optional().nullable()
});

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - Edit Profile' }];
};

export async function action({ request }: ActionFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	if (!id) return redirect('/auth/login');

	const formData = await request.formData();

	const submission = parseWithZod(formData, {
		schema: profileFormSchema
	});

	if (submission.status !== 'success') {
		return submission.reply();
	}

	// Update the user's profile
	await db
		.update(users)
		.set({
			name: submission.value.name,
			imageUrl: submission.value.image_url
		})
		.where(eq(users.id, id));

	return redirect('/');
}

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	if (!id) {
		return redirect('/auth/login');
	}

	const data = await db.query.users.findFirst({
		where: eq(users.id, id)
	});

	if (!data) {
		return redirect('/auth/login');
	}

	return json({
		name: data.name,
		image_url: data.imageUrl
	});
}

export default function Profile() {
	const { name, image_url } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		// Sync the result of last submission
		lastResult,
		defaultValue: {
			name,
			image_url
		}
	});

	return (
		<main>
			<Link to="/" className="absolute left-0 top-0 m-4">
				<Button variant="link" className="items-center gap-2">
					<LucideArrowLeft /> Back
				</Button>
			</Link>
			<div className="mx-auto grid h-min w-[350px] grow gap-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold">Profile</h1>
					<p className="text-balance text-muted-foreground">Edit your Insights profile details.</p>
				</div>
				<Form method="post" id={form.id} onSubmit={form.onSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input
							{...getInputProps(fields.name, {
								type: 'text'
							})}
						/>
						{fields.name.errors && (
							<Alert variant="destructive">
								<AlertTitle>Error!</AlertTitle>
								<AlertDescription>{fields.name.errors}</AlertDescription>
							</Alert>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="image_url">Image</Label>
						<div className="flex flex-row items-center gap-4">
							<Input
								{...getInputProps(fields.image_url, {
									type: 'text'
								})}
							/>
							<Avatar>
								<AvatarImage
									// Validate the image URL before rendering
									src={
										profileFormSchema
											.pick({
												image_url: true
											})
											.parse({
												image_url
											}).image_url || ''
									}
									alt="Profile Image"
								/>
								<AvatarFallback>
									<LucideUser size={24} />
								</AvatarFallback>
							</Avatar>
						</div>
						{fields.image_url.errors && (
							<Alert variant="destructive">
								<AlertTitle>Error!</AlertTitle>
								<AlertDescription>{fields.image_url.errors}</AlertDescription>
							</Alert>
						)}
					</div>
					<Button type="submit" className="w-full">
						Save
					</Button>
				</Form>
			</div>
		</main>
	);
}
