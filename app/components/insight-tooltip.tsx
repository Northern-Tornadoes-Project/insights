import { PropsWithChildren, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

interface InsightsTooltipProps {
	tip?: string | ReactNode;
}

export function InsightsTooltip(props: PropsWithChildren<InsightsTooltipProps>) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>{props.children}</TooltipTrigger>
				<TooltipContent>
					<p>{props.tip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
