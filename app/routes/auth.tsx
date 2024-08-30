import tornado from '~/assets/bnr-tornado.jpg';

import { Outlet } from '@remix-run/react';
import { WesternEngineeringLogo } from '~/components/western-eng-logo';

export default function Auth() {
	return (
		<div className="grid h-screen lg:grid-cols-2">
			<div className="flex flex-col items-center justify-center mx-2">
				<Outlet />
			</div>
			<div className="relative hidden lg:block">
				<img src={tornado} className="h-full object-cover" />
				<WesternEngineeringLogo />
				<div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-background" />
			</div>
		</div>
	);
}
