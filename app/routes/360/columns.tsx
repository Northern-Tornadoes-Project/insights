import { ColumnDef } from '@tanstack/react-table';
import { Badge, BadgeProps } from '~/components/ui/badge';

export type Path = {
	id: string; // UUID
	size: number; // MB
	name: string;
	status: 'processing' | 'completed' | 'failed' | 'archived';
	created: Date;
	modified: Date;
};

export const columns: ColumnDef<Path>[] = [
	{
		header: 'Name',
		accessorKey: 'name'
	},
	{
		header: 'Size (MB)',
		accessorKey: 'size'
	},
	{
		header: 'Status',
		accessorKey: 'status',
		cell: (cell) => {
			const value = cell.getValue() as Path['status'];
			const variant: BadgeProps['variant'] =
				value === 'completed'
					? 'default'
					: value === 'processing'
						? 'secondary'
						: value === 'failed'
							? 'destructive'
							: 'outline';

			return <Badge variant={variant}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
		}
	},
	{
		header: 'Created',
		accessorKey: 'created'
	},
	{
		header: 'Modified',
		accessorKey: 'modified'
	}
];
