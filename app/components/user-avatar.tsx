import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Github, LifeBuoy, LogOut, User } from 'lucide-react';
import { Link } from '@remix-run/react';

export function UserAvatar(props: {
	user: {
		email: string;
		name: string | null;
		imageUrl: string | null;
	};
}) {
	const fallbackName = useMemo(
		() =>
			props.user.name
				?.split(' ')
				.map((part) => part[0].toUpperCase())
				.join(''),
		[props.user.name]
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar>
					<AvatarImage src={props.user.imageUrl || ''} alt={props.user.email} />
					<AvatarFallback>{fallbackName || props.user.email[0].toUpperCase()}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-44">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<Link to="/auth/profile">
					<DropdownMenuItem>
						<User className="mr-2 h-4 w-4" />
						<span>Profile</span>
					</DropdownMenuItem>
				</Link>
				<DropdownMenuSeparator />
				<a
					href="https://www.github.com/Northern-Tornadoes-Project/insights"
					target="_blank"
					rel="noreferrer"
				>
					<DropdownMenuItem>
						<Github className="mr-2 h-4 w-4" />
						<span>GitHub</span>
					</DropdownMenuItem>
				</a>
				<Link to="/support">
					<DropdownMenuItem>
						<LifeBuoy className="mr-2 h-4 w-4" />
						<span>Support</span>
					</DropdownMenuItem>
				</Link>
				<DropdownMenuSeparator />
				<Link to="/auth/logout">
					<DropdownMenuItem>
						<LogOut className="mr-2 h-4 w-4" />
						<span>Log out</span>
					</DropdownMenuItem>
				</Link>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
