import { FormProvider, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { ChevronLeft, ChevronRight, CornerDownLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

interface HailpadDent {
	// TODO: Use shared interface
	id: string;
	angle: string | null;
	centroidX: string;
	centroidY: string;
	majorAxis: string;
	minorAxis: string;
}

// TODO: Move to route
function createUpdateSchema() {
	return z
		.object({
			minor: z.number().min(0, {
				message: 'Minor axis must be positive.'
			}),
			major: z.number().min(0, {
				message: 'Major axis must be greater than minor axis.'
			})
		})
		.refine((data) => data.major > data.minor, {
			path: ['major'],
			message: 'Major axis must be greater than minor axis.'
		});
}

function createCreateSchema() {
	return z
		.object({
			minor: z.number().min(0, {
				message: 'Minor axis must be positive.'
			}),
			major: z.number().min(0, {
				message: 'Major axis must be greater than minor axis.'
			}),
			location: z
				.string()
				.refine(
					(value) => {
						const regex = /^\s*\(\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)\s*$/;
						return regex.test(value);
					},
					{
						message: 'Dent location must be in the format (x, y).'
					}
				)
				.transform((value) => {
					const regex = /^\s*\(\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)\s*$/;
					const match = value.match(regex);
					if (!match) return;
					return [parseFloat(match[1]), parseFloat(match[3])];
				})
		})
		.refine((data) => data.major > data.minor, {
			path: ['major'],
			message: 'Major axis must be greater than minor axis.'
		});
}

function Detail({ label, value }: { label: string; value?: string }) {
	return (
		<div className="flex flex-col">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p>{value}</p>
		</div>
	);
}

export default function DentDetails({
	dentData,
	index,
	onPrevious,
	onNext,
	onIndexChange
}: {
	dentData: HailpadDent[];
	index: number;
	onPrevious?: () => void;
	onNext?: () => void;
	onIndexChange: (index: number) => void;
}) {
	const [minor, setMinor] = useState<number>(0);
	const [major, setMajor] = useState<number>(0);

	const [currentIndex, setCurrentIndex] = useState<number | null>(null);

	const [deleteForm, deleteFields] = useForm({
		onSubmit() {
			const formData = new FormData();
			formData.append('deleteDentID', dentData[index].id);
		}
	});

	const [updateForm, updateFields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createUpdateSchema() });
		},
		onSubmit() {
			const formData = new FormData();
			// formData.append('dentID', dentData[index].id);
			formData.append('updatedMinor', updateFields.minor.value || '');
			formData.append('updatedMajor', updateFields.major.value || '');
		}
	});

	const [createForm, createFields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createCreateSchema() });
		},
		onSubmit() {
			const formData = new FormData();
			formData.append('dentID', dentData[index].id);
			formData.append('createdMinor', createFields.minor.value || '');
			formData.append('createdMajor', createFields.major.value || '');
			formData.append('createdLocation', createFields.location.value || '');
		}
	});

	useEffect(() => {
		if (dentData.length === 0) return;
		setMinor(Number(dentData[index].minorAxis));
		setMajor(Number(dentData[index].majorAxis));
	}, [dentData, index]);

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-row justify-between">
					<div>
						<CardTitle className="mb-2">Dent Details</CardTitle>
						<CardDescription>About the selected dent.</CardDescription>
					</div>
					<div className="flex flex-row justify-end space-x-4">
						<div className="space-x-2">
							<Popover>
								<PopoverTrigger>
									<Button asChild variant="outline" className="h-8 w-8 p-2 hover:text-red-600">
										<Trash2 />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-56">
									<div className="space-y-4">
										<div className="mb-2">
											<p className="text-lg font-semibold">Delete</p>
											<CardDescription className="text-sm">
												Delete the selected dent.
											</CardDescription>
										</div>
										<FormProvider context={deleteForm.context}>
											<Form method="post" id={deleteForm.id} onSubmit={deleteForm.onSubmit}>
												<div className="flex flex-row">
													<Button
														type="submit"
														variant="secondary"
														className="mt-6 flex h-8 w-full flex-row items-center justify-between space-x-2 p-4 px-3 pr-2 text-sm hover:bg-red-600"
													>
														Delete Dent {index + 1}
														<CornerDownLeft className="h-4 w-4" />
													</Button>
												</div>
											</Form>
										</FormProvider>
									</div>
								</PopoverContent>
							</Popover>
							<Popover>
								<PopoverTrigger>
									<Button asChild variant="outline" className="h-8 w-8 p-2">
										<Pencil />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-76">
									<div className="space-y-4">
										<div className="mb-6">
											<p className="text-lg font-semibold">Update</p>
											<CardDescription className="text-sm">
												Modify the selected dent's details.
											</CardDescription>
										</div>
										<FormProvider context={updateForm.context}>
											<Form method="post" id={updateForm.id} onSubmit={updateForm.onSubmit}>
												<div className="mt-1 flex flex-row items-center">
													<div className="mr-4 w-48">
														<Label>Minor Axis (mm)</Label>
													</div>
													<Input
														className="h-8 w-24"
														type="number"
														key={updateFields.minor.key}
														name={updateFields.minor.name}
														defaultValue={updateFields.minor.initialValue}
														placeholder={minor.toFixed(2)}
														step="any"
													/>
												</div>
												<div className="mt-2 flex flex-row items-center">
													<div className="mr-4 w-48">
														<Label>Major Axis (mm)</Label>
													</div>
													<Input
														className="h-8 w-24"
														type="number"
														key={updateFields.major.key}
														name={updateFields.major.name}
														defaultValue={updateFields.major.initialValue}
														placeholder={major.toFixed(2)}
														step="any"
													/>
												</div>
												<div className="flex flex-row justify-end items-center">
													<p className="text-sm text-primary/60">{updateFields.minor.errors}</p>
													<p className="text-sm text-primary/60">{updateFields.major.errors}</p>
													<Button type="submit" variant="secondary" className="mt-4 h-8 w-8 p-2 ml-4">
														<CornerDownLeft />
													</Button>
												</div>
											</Form>
										</FormProvider>
									</div>
								</PopoverContent>
							</Popover>
							<Popover>
								<PopoverTrigger>
									<Button asChild variant="outline" className="h-8 w-8 p-2">
										<Plus />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-76">
									<div className="space-y-4">
										<div className="mb-6">
											<p className="text-lg font-semibold">Create</p>
											<CardDescription className="text-sm">
												Save a new dent to the hailpad.
											</CardDescription>
										</div>
										<FormProvider context={createForm.context}>
											<Form method="post" id={createForm.id} onSubmit={createForm.onSubmit}>
												<div className="mt-1 flex flex-row items-center">
													<div className="mr-4 w-48">
														<Label>Minor Axis (mm)</Label>
													</div>
													<Input
														className="h-8 w-28"
														type="number"
														key={createFields.minor.key}
														name={createFields.minor.name}
														defaultValue={createFields.minor.initialValue}
														placeholder="b"
														step="any"
													/>
												</div>
												<div className="mt-2 flex flex-row items-center">
													<div className="mr-4 w-48">
														<Label>Major Axis (mm)</Label>
													</div>
													<Input
														className="h-8 w-28"
														type="number"
														key={createFields.major.key}
														name={createFields.major.name}
														defaultValue={createFields.major.initialValue}
														placeholder="a"
														step="any"
													/>
												</div>
												<div className="mt-2 flex flex-row items-center">
													<div className="mr-4 w-48">
														<Label>Dent Location</Label>
													</div>
													<Input
														className="h-8 w-28"
														type="string"
														key={createFields.location.key}
														name={createFields.location.name}
														defaultValue={createFields.location.initialValue}
														placeholder="(x, y)"
														step="any"
													/>
												</div>
												<div className="flex flex-row justify-end items-center">
													<p className="text-sm text-primary/60">{createFields.minor.errors}</p>
													<p className="text-sm text-primary/60">{createFields.major.errors}</p>
													<p className="text-sm text-primary/60">{createFields.location.errors}</p>
													<Button type="submit" variant="secondary" className="mt-4 h-8 w-8 ml-4 p-2">
														<CornerDownLeft />
													</Button>
												</div>

											</Form>
										</FormProvider>
									</div>
								</PopoverContent>
							</Popover>
						</div>
						<div className="space-x-2">
							<Button className="h-8 w-8 p-2" variant="secondary" onClick={() => onPrevious?.()}>
								<ChevronLeft />
							</Button>
							<Button className="h-8 w-8 p-2" variant="secondary" onClick={() => onNext?.()}>
								<ChevronRight />
							</Button>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="col-span-2">
					<Detail label="Dent" />
					<div className="mt-1 flex flex-row items-center gap-2">
						<Input
							className="h-8 w-20"
							type="number"
							min={1}
							max={dentData.length}
							placeholder={`${index + 1}`}
							onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
						/>
						<p>/</p>
						<p>{`${dentData.length}`}</p>
						<Button
							className="ml-2 h-8 w-8 p-2"
							variant="secondary"
							size="icon"
							onClick={() => {
								onIndexChange(Number(currentIndex) - 1);
								setCurrentIndex(null);
							}}
						>
							<CornerDownLeft />
						</Button>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-4">
					<Detail label="Minor Axis" value={`${minor.toFixed(2)} mm`} />
					<Detail label="Major Axis" value={`${major.toFixed(2)} mm`} />
					<Detail label="TODO" value={`TODO`} />
				</div>
			</CardContent>
		</Card>
	);
}
