import { useEventSource } from 'remix-utils/sse/react';

export const useUploadProgress = <T>(id: string) => {
	const progressStream = useEventSource(`/360/new/${id}/progress`, {
		event: id.toString()
	});

	if (progressStream) {
		try {
			const event = JSON.parse(progressStream) as T;
			return { success: true, event } as const;
		} catch (cause) {
			return { success: false };
		}
	}
};
