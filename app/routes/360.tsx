import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/lib/auth.server';
import { getUser } from '~/db/db.server';
import { Header } from '~/components/header';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	const user = id ? await getUser(id) : undefined;

	return json({ user });
}

export default function Layout() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<Header title="360" user={data.user} />
			<div className="mx-6 py-4">
				<Outlet context={data.user} />
			</div>
		</>
	);
}
