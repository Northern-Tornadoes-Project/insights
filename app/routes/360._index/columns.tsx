import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '~/lib/utils';
import { StatusBadge } from './status-badge';
import { paths } from '~/db/schema';
import { DataTableColumnHeader } from './column-header';

export type Path = {
	id: string;
	name: string;
	eventDate: Date;
	createdAt: Date;
	updatedAt: Date;
	status: (typeof paths.$inferSelect)['status'];
	captures: number;
	size: number;
};

export const columns: ColumnDef<Path>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		accessorKey: 'name'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title='Size (MB)' />,
		accessorKey: 'size'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title='Captures' />,
		accessorKey: 'captures'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		accessorKey: 'status',
		cell: (cell) => <StatusBadge status={cell.getValue() as Path['status']} />
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
		accessorKey: 'created',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title='Modified' />,
		accessorKey: 'modified',
		cell: (cell) => formatDate(cell.getValue() as Date)
	}
];
