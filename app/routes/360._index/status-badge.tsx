import { Badge } from '~/components/ui/badge';
import type { Path } from './columns';

export function StatusBadge({ status }: { status: Path['status'] }) {
	const variant =
		status === 'completed'
			? 'default'
			: status === 'processing'
				? 'secondary'
				: status === 'failed'
					? 'destructive'
					: 'outline';

	return <Badge className='w-min' variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}
