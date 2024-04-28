import tornado from '~/assets/bnr-tornado.jpg';

import { Outlet } from "@remix-run/react";
import { WesternEngineeringLogo } from "~/components/western-eng-logo";

export default function Auth() {
	return (
		<div className="h-screen grid lg:grid-cols-2">
			<div className="flex flex-col justify-center items-center">
				<Outlet />
			</div>
			<div className="hidden lg:block relative">
				<img src={tornado} className="object-cover h-full" />
				<WesternEngineeringLogo />
				<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-background" />
			</div>
		</div>
	);
}
