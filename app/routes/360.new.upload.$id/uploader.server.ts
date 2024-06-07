import { unstable_createFileUploadHandler } from '@remix-run/node';
import { env } from '~/env.server';
import { paths } from '~/db/schema';

export const buildHandler = (path: typeof paths.$inferSelect) =>
	unstable_createFileUploadHandler({
		directory: `${env.PATH_DIRECTORY}/${path.folderName}`,
		maxPartSize: 50 * 1024 * 1024,
		filter: async (file) => {
			if (!file.contentType) return false;
			return file.contentType === 'image/jpeg' || file.contentType === 'image/png';
		}
	});
