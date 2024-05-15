import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { authenticator } from '~/lib/auth.server';
import { authSessionResolver } from '~/lib/sessions.server';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - Login' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/'
	});

	const session = await authSessionResolver.getSession(request.headers.get('Cookie'));
	const authError = session.get(authenticator.sessionErrorKey) as Error | undefined;

	return json(
		{
			authError
		},
		{
			headers: {
				'Set-Cookie': await authSessionResolver.commitSession(session)
			}
		}
	);
}

export async function action({ request }: ActionFunctionArgs) {
	const url = new URL(request.url);
	const currentPath = url.pathname;

	await authenticator.authenticate('TOTP', request, {
		successRedirect: '/auth/verify',
		failureRedirect: currentPath
	});
}

export default function Login() {
	const { authError } = useLoaderData<typeof loader>();

	return (
		<div className="grid gap-6 w-[350px] mx-auto h-min">
			<div className="text-center">
				<h1 className="text-3xl font-bold">Login</h1>
				<p className="text-balance text-muted-foreground">Enter your email to receive a code.</p>
			</div>
			<Form method="post" className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input type="email" id="email" name="email" placeholder="Email..." required />
				</div>
				<Button type="submit" className="w-full">
					Send code
				</Button>
				{authError && (
					<Alert variant="destructive">
						<AlertTitle>Error!</AlertTitle>
						<AlertDescription>{authError.message}</AlertDescription>
					</Alert>
				)}
			</Form>
		</div>
	);
}
