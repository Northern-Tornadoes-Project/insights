import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Path } from './columns';
import { Button } from '~/components/ui/button';
import { LucideEdit, LucideX } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { Link } from '@remix-run/react';

export function PathCard({
	path,
	loggedIn,
	onClose
}: {
	path: Path;
	loggedIn?: boolean;
	onClose: () => void;
}) {
	return (
		<Card className="min-w-96 h-min">
			<div className="flex flex-row justify-between items-center pr-6">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<StatusBadge status={path.status} />
				</CardHeader>
				<div className="flex flex-row items-center gap-2">
					{loggedIn && (
						<Button variant="secondary" size="icon">
							<LucideEdit />
						</Button>
					)}
					<Button variant="outline" size="icon" onClick={onClose}>
						<LucideX />
					</Button>
				</div>
			</div>
			<CardContent>
				{path.status === 'processing' && <p>Fetching status from path service...</p>}
			</CardContent>
			<CardFooter className="justify-end">
				<Link to={`/360/${path.id}`} prefetch="none">
					<Button>View</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
