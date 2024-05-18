import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/header';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { getUser } from '~/db/db.server';
import { authenticator } from '~/lib/auth.server';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - Support' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);
	const user = id ? await getUser(id) : undefined;

	return json({ user });
}

export default function Support() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<Header title="Support" user={data.user} />
			<div className="flex justify-center w-full py-4">
				<div className="flex flex-col gap-4 max-w-6xl">
					<Card>
						<CardHeader>
							<CardTitle>Frequently Asked Questions</CardTitle>
						</CardHeader>
						<CardContent>
							<Accordion type="multiple">
								<AccordionItem value="item-1">
									<AccordionTrigger>How do I create a new 360 path?</AccordionTrigger>
									<AccordionContent>
										Yes. It adheres to the WAI-ARIA design pattern.
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>More Help?</CardTitle>
							<CardDescription>Get in touch with us.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="col-span-1">
									<Label htmlFor="name">Name</Label>
									<Input id="name" placeholder="Name" />
								</div>
								<div className="col-span-1">
									<Label htmlFor="email">Email</Label>
									<Input id="email" type="email" placeholder="Email" />
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button>Send message</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		</>
	);
}
