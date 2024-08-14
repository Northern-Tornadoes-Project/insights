import { Link } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/table/column-header';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { scans } from '~/db/schema';
import { formatDate } from '~/lib/utils';

export type Scan = {
	id: string;
	name: string;
	eventDate: Date;
	captureDate: Date;
	status: (typeof scans.$inferSelect)['status'];
	size: number;
};

export const columns: ColumnDef<Scan>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		accessorKey: 'name',
		cell: (cell) => (
			<Link to={`/lidar/${cell.row.original.id}`}>
				<Button variant="link">{cell.getValue() as string}</Button>
			</Link>
		)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Size (MB)" />,
		accessorKey: 'size',
		cell: (cell) => ((cell.getValue() as number) / 1024 / 1024).toFixed(2)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Event Date" />,
		accessorKey: 'eventDate',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Capture Date" />,
		accessorKey: 'captureDate',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		accessorKey: 'status',
		cell: (cell) => {
			const status = cell.getValue() as Scan['status'];
			const variant =
				status === 'complete'
					? 'default'
					: status === 'processing'
						? 'secondary'
						: status === 'failed'
							? 'destructive'
							: 'outline';

			return (
				<Badge className="w-min" variant={variant}>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			);
		}
	}
];
