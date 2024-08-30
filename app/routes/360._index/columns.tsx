import { ColumnDef } from '@tanstack/react-table';
import type { SegmentPoint } from '~/components/path-map';
import { DataTableColumnHeader } from '~/components/table/column-header';
import { paths } from '~/db/schema';
import { formatDate } from '~/lib/utils';
import { StatusBadge } from './status-badge';

export type Path = {
	id: string;
	name: string;
	eventDate: Date;
	createdAt: Date;
	status: (typeof paths.$inferSelect)['status'];
	captures: number;
	size: number;
	hidden: boolean;
	segments: SegmentPoint[];
};

export const columns: ColumnDef<Path>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		accessorKey: 'name',
		sortingFn: 'text'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Size (MB)" />,
		accessorKey: 'size',
		cell: (cell) => ((cell.getValue() as number) / 1024 / 1024).toFixed(2),
		sortingFn: 'auto'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Captures" />,
		accessorKey: 'captures',
		sortingFn: 'auto'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		accessorKey: 'status',
		cell: (cell) => <StatusBadge status={cell.getValue() as Path['status']} />,
		sortingFn: 'auto'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Event Date" />,
		accessorKey: 'eventDate',
		cell: (cell) => formatDate(cell.getValue() as Date),
		sortingFn: 'datetime'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		accessorKey: 'createdAt',
		cell: (cell) => formatDate(cell.getValue() as Date),
		sortingFn: 'datetime'
	}
];
