import { createFileUploadHandler } from '@remix-run/node/dist/upload/fileUploadHandler';
import { env } from '~/env.server';

export const framePosUploadHandler = ({ folder_name }: { folder_name: string }) => {
	return createFileUploadHandler({
		directory: `${env.PATH_DIRECTORY}/${folder_name}`,
		avoidFileConflicts: false
	});
};
