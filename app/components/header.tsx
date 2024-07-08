import { Link } from '@remix-run/react';
import { LucideTornado } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { UserAvatar } from './user-avatar';

export function Header({
	title,
	user,
	className
}: {
	title: string;
	user?: {
		email: string;
		name: string | null;
		imageUrl: string | null;
	};
	className?: string;
}) {
	return (
		<header
			className={cn(
				'sticky top-0 flex justify-between py-4 items-center gap-4 border-b bg-background mb-2 px-4 md:px-6',
				className
			)}
		>
			<div className="flex flex-row gap-4 items-center">
				<Link to="/">
					<Button variant="outline" size="icon">
						<LucideTornado size={24} />
					</Button>
				</Link>
				<h1 className="text-xl font-bold">
					Insights <span className="font-normal">{title}</span>
				</h1>
			</div>
			{user && <UserAvatar user={user} />}
		</header>
	);
}
