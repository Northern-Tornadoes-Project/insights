import { useUploadProgress } from '~/lib/use-upload-progress';
import { UploadProgressEvent } from '~/routes/360.new.$id.images/uploader.server';

export function UploadProgress({ id }: { id: string }) {
	const progress = useUploadProgress<UploadProgressEvent>(id);

	return (
		<div>
			{progress?.event ? (
				<div>
					<div>{progress.event?.percentage * 100}%</div>
					<progress value={progress.event?.percentage * 100} max={100} />
				</div>
			) : (
				<div>Uploading...</div>
			)}
		</div>
	);
}
