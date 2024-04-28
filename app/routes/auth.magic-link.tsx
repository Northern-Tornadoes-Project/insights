import { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
	await authenticator.authenticate('TOTP', request, {
		successRedirect: '/',
		failureRedirect: '/auth/login'
	});
}
