import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { db } from '~/db/db.server';
import { paths } from '~/db/schema';
import { authenticator } from '~/lib/auth.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await authenticator.isAuthenticated(request);

	if (!userId) {
		return redirect('/auth/login');
	}

	if (!params.id) {
		return redirect('/360');
	}

	const path = await db.query.paths.findFirst({
		where: eq(paths.id, params.id)
	});

	if (!path) {
		throw new Error('Path not found');
	}

	return json(path);
}

export async function action({ request }: ActionFunctionArgs) {
	return null;
}

export default function () {
	const path = useLoaderData<typeof loader>();

	return (
		<main className="flex justify-center items-center h-full">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<CardDescription>Upload the .</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-2">

				</CardContent>
				<CardFooter>
					<Button type="submit">Next</Button>
				</CardFooter>
			</Card>
		</main>
	);
}
