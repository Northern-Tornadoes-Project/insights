import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: Date, type: 'date' | 'date-time' = 'date') {
	return Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: type === 'date-time' ? 'numeric' : undefined,
		minute: type === 'date-time' ? 'numeric' : undefined,
		second: type === 'date-time' ? 'numeric' : undefined,
		timeZoneName: type === 'date-time' ? 'short' : undefined
	}).format(date);
}
