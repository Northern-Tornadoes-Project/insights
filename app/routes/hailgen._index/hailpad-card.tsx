import { Link } from '@remix-run/react';
import { LucideX } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Hailpad } from './columns';

export function HailpadCard({
	hailpad,
	loggedIn,
	onClose
}: {
	hailpad: Hailpad;
	loggedIn?: boolean;
	onClose: () => void;
}) {
	return (
		<Card className="h-min min-w-96">
			<div className="flex flex-row items-center justify-between pr-6">
				<CardHeader>
					<CardTitle>{hailpad.name}</CardTitle>
				</CardHeader>
				<div className="flex flex-row items-center gap-2">
					<Button variant="outline" size="icon" onClick={onClose}>
						<LucideX />
					</Button>
				</div>
			</div>
			{/* <CardContent>
				{hailpad.status === 'processing' && <p>Fetching status from Hailgen service...</p>}
			</CardContent> */}
			<CardFooter className="justify-end">
				<Link to={`/hailgen/${hailpad.id}`} prefetch="none">
					<Button>View</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
