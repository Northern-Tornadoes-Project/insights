import { Link } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { LucideEdit, LucideSquareArrowOutUpRight } from 'lucide-react';
import { Badge, BadgeProps } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { formatDate } from '~/lib/utils';

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
		accessorKey: 'created',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: 'Modified',
		accessorKey: 'modified',
		cell: (cell) => formatDate(cell.getValue() as Date)
	},
	{
		header: 'Actions',
		accessorKey: 'id',
		cell: (cell) => {
			const id = cell.getValue() as string;

			return (
				<div className="flex flex-row gap-2 items-center">
					<Link to={`/360/${id}`} prefetch='none'>
						<Button size="icon">
							<LucideSquareArrowOutUpRight size={24} />
						</Button>
					</Link>
					<Button variant="outline" size="icon">
						<LucideEdit size={24} />
					</Button>
				</div>
			);
		}
	}
];
