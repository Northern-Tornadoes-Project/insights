import tornado from '~/assets/bnr-tornado.jpg';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, json, useLoaderData } from '@remix-run/react';
import { Axis3D, CloudHail, Rotate3D } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { version } from '~/../package.json';
import { authenticator } from '~/lib/auth.server';
import { getUser } from '~/db/db.server';
import { UserAvatar } from '~/components/user-avatar';
import { WesternEngineeringLogo } from '~/components/western-eng-logo';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - Home' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	if (!id) return json(null);

	const user = await getUser(id);

	if (!user)
		return json(null, {
			status: 404
		});

	return json({
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			imageUrl: user.imageUrl
		}
	});
}

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className='h-screen'>
			<div className='relative z-0 h-screen'>
				<img className='w-full h-full object-cover' src={tornado} alt='Tornado' />
				<div className='absolute top-0 left-0 w-full h-full bg-gradient-to-r from-background' />
			</div>
			<div className='absolute top-0 left-0 w-full h-full'>
				<WesternEngineeringLogo />
				<header className='absolute top-0 right-0 m-4'>
					{data ? (
						<div className='flex flex-row gap-4'>
							<UserAvatar user={data.user} />
						</div>
					) : (
						<Link to='/auth/login'>
							<Button variant='secondary'>Login</Button>
						</Link>
					)}
				</header>
				<main className='flex flex-col justify-center gap-8 p-6 lg:p-16 h-screen'>
					<h1 className='text-7xl'>
						<b>NTP</b> Insights
					</h1>
					<h3 className='text-2xl font-semibold'>v{version}</h3>
					<nav className='flex flex-row gap-4'>
						<Link to='/360'>
							<Button className='gap-2'>
								<Rotate3D /> 360
							</Button>
						</Link>
						<Link to='/lidar'>
							<Button className='gap-2'>
								<Axis3D /> LiDAR
							</Button>
						</Link>
						<Link to='/hail-gen'>
							<Button className='gap-2'>
								<CloudHail /> HailGen
							</Button>
						</Link>
					</nav>
				</main>
			</div>
		</div>
	);
}
