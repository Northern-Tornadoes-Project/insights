import { Link } from '@remix-run/react';
import { LucideEdit, LucideX } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Hailpad } from './columns';
import { StatusBadge } from './status-badge';

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
		<Card className="min-w-96 h-min">
			<div className="flex flex-row justify-between items-center pr-6">
				<CardHeader>
					<CardTitle>{hailpad.name}</CardTitle>
				</CardHeader>
				<div className="flex flex-row items-center gap-2">
					{loggedIn && (
						<Button
							variant="secondary"
							size="icon"
							onClick={() => {
								window.location.href = `/hailgen/${hailpad.id}`;
							}}
						>
							<LucideEdit />
						</Button>
					)}
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
