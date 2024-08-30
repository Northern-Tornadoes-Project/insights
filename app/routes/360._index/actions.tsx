import { useOutletContext } from '@remix-run/react';
import { LucideCode2, LucideEllipsis, LucideEye, LucideEyeOff, LucideLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';

type ActionsProps = {
	id: string;
	hidden: boolean;
};

export function Actions({ id, hidden }: ActionsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const user = useOutletContext<{
		id: string;
		email: string;
		name: string;
		imageUrl: string;
	} | null>();

	const handleContinueClick = async () => {
		try {
			const response = await fetch(`/action/360/set-hidden?id=${id}&hidden=${!hidden}`, {
				method: 'POST'
			});

			if (response.ok) {
				// Reload the page to update the hidden status
				window.location.reload();
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleCopyLink = async () => {
		await navigator.clipboard.writeText(`${window.location.origin}/360/${id}`);
		toast.info('Link copied to clipboard');
	};

	const handleCopyIframe = async () => {
		await navigator.clipboard.writeText(
			`<iframe src="${window.location.origin}/360/frame/${id}" width="100%" height="100%"></iframe>`
		);
		toast.info('iframe copied to clipboard');
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<LucideEllipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleCopyLink}>
						<LucideLink className="mr-2 h-4 w-4" />
						<span>Copy link</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleCopyIframe}>
						<LucideCode2 className="mr-2 h-4 w-4" />
						<span>Copy iframe</span>
					</DropdownMenuItem>
					{user && (
						<DropdownMenuItem onClick={() => setIsOpen(true)}>
							{hidden ? (
								<LucideEye className="mr-2 h-4 w-4" />
							) : (
								<LucideEyeOff className="mr-2 h-4 w-4" />
							)}
							<span>{hidden ? 'Show' : 'Hide'}</span>
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action can be undone, but will require direct database access. This will prevent
						the 360 path from being publicly accessible.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={() => handleContinueClick()}>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
