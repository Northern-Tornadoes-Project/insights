import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '~/lib/utils';
import { StatusBadge } from './status-badge';

export type Path = {
	id: string; // UUID
	size: number; // MB
	captures: number; // Number of images
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
		header: 'Captures',
		accessorKey: 'captures'
	},
	{
		header: 'Status',
		accessorKey: 'status',
		cell: (cell) => <StatusBadge status={cell.getValue() as Path['status']} />
	},
	{
		header: 'Created',
		accessorKey: 'created',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: 'Modified',
		accessorKey: 'modified',
		cell: (cell) => formatDate(cell.getValue() as Date)
	}
];
