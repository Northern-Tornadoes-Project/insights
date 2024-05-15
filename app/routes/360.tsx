import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { LucideTornado } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { UserAvatar } from '~/components/user-avatar';
import { authenticator } from '~/lib/auth.server';
import { getUser } from '~/db/db.server';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	const user = id ? await getUser(id) : undefined;

	return json({
		user: user
			? {
					id: user.id,
					email: user.email,
					name: user.name,
					imageUrl: user.imageUrl
				}
			: null
	});
}

export default function Layout() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="bg-muted/40 h-screen">
			<header className="sticky top-0 flex justify-between py-4 items-center gap-4 border-b bg-background px-4 md:px-6">
				<div className="flex flex-row gap-4 items-center">
					<Link to="/">
						<Button variant="outline" size="icon">
							<LucideTornado size={24} />
						</Button>
					</Link>
					<h1 className="text-xl font-bold">
						Insights <span className="font-normal">360</span>
					</h1>
				</div>
				{data.user && <UserAvatar user={data.user} />}
			</header>
			<div className="mx-6 py-4">
				<Outlet context={data.user} />
			</div>
		</div>
	);
}
