import type { FrameposResult } from "@/utils/types/framepos";
import { type Image360 } from "@prisma/client";

export type FormStateData = {
	name: string;
	date: Date;
	path_id?: string;
	framepos: FrameposResult[];
	surveys: Image360[];
	comparison: File[];
};

export type DialogContentProps = {
	formState: FormStateData;
	setFormState: (data: FormStateData) => void;
	onNext?: () => void;
	onCancel?: () => void;
};

export type ImageResult = {
	image_name: string;
	image_url?: string;
};

// Data received from client
export type UploadData = {
	uploadType: 'survey' | 'comparison';
	id: string;
	files: {
		name: string;
		buffer: File;
	}[];
};

// Data sent to client
export type CallbackData = FrameposResult[] | ImageResult[] | null;