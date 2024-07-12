import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '~/lib/utils';
import { DataTableColumnHeader } from './column-header';

export type Hailpad = {
	id: string;
	name: string;
	dents: number;
	createdAt: Date;
	updatedAt: Date;
};

export const columns: ColumnDef<Hailpad>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		accessorKey: 'name'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Dents" />,
		accessorKey: 'dents'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		accessorKey: 'created',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Modified" />,
		accessorKey: 'modified',
		cell: (cell) => formatDate(cell.getValue() as Date)
	}
];
