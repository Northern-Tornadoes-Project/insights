import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/table/column-header';
import { formatDate } from '~/lib/utils';

export type Hailpad = {
	id: string;
	name: string;
	folderName: string;
	dents: number;
	createdAt: Date;
	updatedAt: Date;
};

export const columns: ColumnDef<Hailpad>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		accessorKey: 'name',
		sortingFn: 'text'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Dents" />,
		accessorKey: 'dents',
		sortingFn: 'auto'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		accessorKey: 'created',
		cell: (cell) => formatDate(cell.getValue() as Date),
		sortingFn: 'datetime'
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Modified" />,
		accessorKey: 'modified',
		cell: (cell) => formatDate(cell.getValue() as Date),
		sortingFn: 'datetime'
	}
];
