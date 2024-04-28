import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '~/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { authenticator } from '~/lib/auth.server';
import { authSessionResolver } from '~/lib/sessions.server';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - Verify' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/'
	});

	const session = await authSessionResolver.getSession(request.headers.get('cookie'));
	const authEmail = session.get('auth:email');
	const authError = session.get(authenticator.sessionErrorKey);
	if (!authEmail) return redirect('/auth/login');

	// Commit session to clear any `flash` error message.
	return json(
		{ authError },
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
		successRedirect: currentPath,
		failureRedirect: currentPath
	});
}

export default function Verify() {
	const { authError } = useLoaderData<typeof loader>();

	return (
		<div className="grid gap-6 mx-auto h-min">
			<div className="text-center">
				<h1 className="text-3xl font-bold">Verify</h1>
				<p className="text-balance text-muted-foreground">Enter the code sent to your email.</p>
			</div>
			<Form method="POST" className="grid gap-4">
				<InputOTP
					name="code"
					maxLength={6}
					pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
					render={({ slots }) => (
						<>
							<InputOTPGroup>
								{slots.slice(0, 6).map((slot, index) => (
									<InputOTPSlot key={index} {...slot} />
								))}
							</InputOTPGroup>
						</>
					)}
				/>
				<Button type="submit">Continue</Button>
			</Form>

			{/* Renders the form that requests a new code. */}
			{/* Email input is not required, it's already stored in Session. */}
			<Form method="POST">
				<Button type="submit" variant="outline" className="w-full">
					Request new Code
				</Button>
			</Form>

			{/* Code Errors Handling. */}
			{authError && (
				<Alert variant="destructive">
					<AlertTitle>Error!</AlertTitle>
					<AlertDescription>{authError.message}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
