import { LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { authenticator } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
	const auth = await authenticator.isAuthenticated(request);

	if (!auth) {
		return redirect('/auth/login');
	}

	return json({
		auth
	});
}

export default function Profile() {
	return (
		<div>
			<h1>Profile</h1>
		</div>
	);
}
