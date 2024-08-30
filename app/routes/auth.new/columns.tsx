import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/table/column-header';
import { Badge } from '~/components/ui/badge';
import { formatDate } from '~/lib/utils';

export type AwaitingEmail = {
	email: string;
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export const columns: ColumnDef<AwaitingEmail>[] = [
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
		accessorKey: 'email',
        enableHiding: false
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		accessorKey: 'enabled',
		cell: (cell) => {
			const status = cell.getValue() as AwaitingEmail['enabled'];
			return (
				<Badge variant={status ? 'default' : 'secondary'}>{status ? 'Active' : 'Inactive'}</Badge>
			);
		}
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		accessorKey: 'createdAt',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
		accessorKey: 'updatedAt',
		cell: (cell) => formatDate(cell.getValue() as Date)
	}
];
