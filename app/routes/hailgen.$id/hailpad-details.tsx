import { CornerDownLeft, FileSpreadsheet, Filter, FilterX, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import Histogram from './histogram';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { FormProvider, useForm } from '@conform-to/react';
import { Form, useActionData, useFetcher, useLoaderData, useSubmit } from '@remix-run/react';
// import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
// import { protectedRoute } from '~/lib/auth.server';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { Separator } from '~/components/ui/separator';
import { Slider } from '~/components/ui/slider';
// import { db } from '~/db/db.server';
// import { hailpad } from '~/db/schema';
// import { eq } from 'drizzle-orm';

interface HailpadDent {
    // TODO: Use shared interface
    angle: string | null;
    centroidX: string;
    centroidY: string;
    majorAxis: string;
    minorAxis: string;
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    );
}

function DetailSection({ min, max, avg }: { min: number; max: number; avg: number }) {
    const minStr = min.toFixed(2).toString();
    const maxStr = max.toFixed(2).toString();
    const avgStr = avg.toFixed(2).toString();

    return (
        <div className="m-4 grid grid-cols-3 gap-4">
            <Detail label="Minimum" value={`${minStr} mm`} />
            <Detail label="Maximum" value={`${maxStr} mm`} />
            <Detail label="Average" value={`${avgStr} mm`} />
        </div>
    );
}

function createSchema() {
    return z.object({
        boxfit: z.number().min(0, {
            message: 'Box-fitting length must be positive.'
        })
    });
}

// export async function loader({ params, request }: LoaderFunctionArgs) {
//     const { id } = params;

//     await protectedRoute(request);
//     return id;
// }

// export async function action({ request }: ActionFunctionArgs) {
//     const userId = await protectedRoute(request);
//     const formData = await request.formData();
//     const submission = await parseWithZod(formData, {
//         schema: createSchema(),
//         async: true
//     });

//     if (submission.status !== 'success') {
//         return json(submission.reply());
//     }

//     const { boxfit } = submission.value;
//     const id = useLoaderData<typeof loader>();

//     await db
//         .update(hailpad)
//         .set({ boxfit: Number(boxfit).toString(), updatedBy: userId })
//         .where(eq(hailpad.id, id));
// }

export default function HailpadDetails({
    dentData,
    boxfit,
    maxDepth,
    adaptiveBlockSize,
    adaptiveC,
    // fetcher,
    onFilterChange,
    onShowCentroids,
    // onBoxfitChange,
    onDownload
}: {
    dentData: HailpadDent[];
    boxfit: string;
    maxDepth: string;
    adaptiveBlockSize: string;
    adaptiveC: string;
    // fetcher: any;
    onFilterChange: (value: object) => void; // TODO: Define interface
    onShowCentroids: (value: boolean) => void;
    onDownload: (value: boolean) => void;
}) {
    const [minMinor, setMinMinor] = useState<number>(0);
    const [maxMinor, setMaxMinor] = useState<number>(0);

    const [minMajor, setMinMajor] = useState<number>(0);
    const [maxMajor, setMaxMajor] = useState<number>(0);

    const [avgMinor, setAvgMinor] = useState<number>(0);
    const [avgMajor, setAvgMajor] = useState<number>(0);

    const [adaptiveBlockSliderValue, setAdaptiveBlockSliderValue] = useState<number>(0);
    const [adaptiveCSliderValue, setAdaptiveCSliderValue] = useState<number>(0);

    // const lastResult = useActionData<typeof action>();
    // const [boxfitForm, boxfitFields] = useForm({
    //     lastResult,
    //     onValidate({ formData }) {
    //         return parseWithZod(formData, { schema: createSchema() });
    //     }
    // });

    // const [boxfitForm, boxfitFields] = useForm({
    //     onValidate({ formData }) {
    //         return parseWithZod(formData, { schema: createSchema() });
    //     },
    //     onSubmit(event: React.FormEvent<HTMLFormElement>) {
    //         event.preventDefault();
    //         const formData = new FormData(event.target as HTMLFormElement);
    //         const boxfit = Number(formData.get(boxfitFields.boxfit.name));
    //         onBoxfitChange(Number(boxfit));
    //     }
    // });

    const [maxDepthForm, maxDepthFields] = useForm({}); // TODO
    const [thresholdForm, thresholdFields] = useForm({}); // TODO
    const [filterForm, filterFields] = useForm({}); // TODO

    // const submit = useSubmit();

    const boxfitFetcher = useFetcher({ key: "boxfit"});

    const [boxfitForm, boxfitFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createSchema() });
        },
        onSubmit() {
            const formData = new FormData();
            formData.append(boxfitFields.boxfit.name, boxfitFields.boxfit.value || "");
            console.log(formData);
            boxfitFetcher.submit(formData);
        }
    });

    // const formData = new FormData();
    // fetcher.submit(event.currentTarget.form, { method: "post" });

    useEffect(() => {
        setMinMinor(Math.min(...dentData.map((dent) => Number(dent.minorAxis))));
        setMaxMinor(Math.max(...dentData.map((dent) => Number(dent.minorAxis))));

        setMinMajor(Math.min(...dentData.map((dent) => Number(dent.majorAxis))));
        setMaxMajor(Math.max(...dentData.map((dent) => Number(dent.majorAxis))));

        setAvgMinor(dentData.reduce((acc, dent) => acc + Number(dent.minorAxis), 0) / dentData.length);
        setAvgMajor(dentData.reduce((acc, dent) => acc + Number(dent.majorAxis), 0) / dentData.length);

        setAdaptiveBlockSliderValue(Number(adaptiveBlockSize));
        setAdaptiveCSliderValue(Number(adaptiveC));
    }, [dentData, adaptiveBlockSize, adaptiveC]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-row justify-between">
                    <div>
                        <CardTitle className="mb-2">Hailpad Details</CardTitle>
                        <CardDescription>About the current hailpad view.</CardDescription>
                    </div>
                    <div className="justify-end">
                        <Popover>
                            <PopoverTrigger>
                                <Button asChild variant="outline" className="w-8 h-8 p-2">
                                    <Settings />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-76">
                                <div className="space-y-4">
                                    <div className="mb-6">
                                        <p className="font-semibold text-lg">
                                            View
                                        </p>
                                        <CardDescription className="text-sm">
                                            Adjust depth map overlays and calibration values.
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-row items-center space-x-2">
                                        <Checkbox
                                            id="show-centroids"
                                            onCheckedChange={onShowCentroids}
                                        />
                                        <Label
                                            htmlFor="show-centroids"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Show centroids
                                        </Label>
                                    </div>
                                    <FormProvider context={boxfitForm.context}>
                                        <boxfitFetcher.Form method="post" id={boxfitForm.id} onSubmit={boxfitForm.onSubmit}>
                                            <div className="flex flex-row items-center mt-1">
                                                <div className="w-48 mr-4">
                                                    <Label htmlFor={boxfitFields.boxfit.id}>Box-fitting Length (mm)</Label>
                                                </div>
                                                <Input
                                                    className="w-20 h-8 mr-4"
                                                    type="number"
                                                    key={boxfitFields.boxfit.key}
                                                    name={boxfitFields.boxfit.name}
                                                    defaultValue={boxfitFields.boxfit.initialValue}
                                                    placeholder={boxfit}
                                                    step="any"
                                                />
                                                <Button type="submit" variant="secondary" className="w-8 h-8 p-2">
                                                    <CornerDownLeft />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-primary/60">{boxfitFields.boxfit.errors}</p>
                                        </boxfitFetcher.Form>
                                    </FormProvider>
                                    <FormProvider context={maxDepthForm.context}>
                                        <Form id={maxDepthForm.id} onSubmit={maxDepthForm.onSubmit}>
                                            <div className="flex flex-row items-center mt-1">
                                                <div className="w-48 mr-4">
                                                    <Label htmlFor={maxDepthFields.boxfit.id}>Maximum Depth (mm)</Label>
                                                </div>
                                                <Input
                                                    className="w-20 h-8 mr-4"
                                                    type="number"
                                                    key={maxDepthFields.maxDepth.key}
                                                    name={maxDepthFields.maxDepth.name}
                                                    // defaultValue={maxDepthFields.maxDepth.initialValue} TODO
                                                    placeholder={maxDepth}
                                                    step="any"
                                                />
                                                <Button type="submit" variant="secondary" className="w-8 h-8 p-2">
                                                    <CornerDownLeft />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-primary/60">{maxDepthFields.maxDepth.errors}</p>
                                        </Form>
                                    </FormProvider>
                                    <Separator />
                                    <div className="mb-4">
                                        <p className="font-semibold text-lg">
                                            Reprocess
                                        </p>
                                        <CardDescription className="text-sm">
                                            Adjust depth map thresholding.
                                        </CardDescription>
                                    </div>
                                    <FormProvider context={thresholdForm.context}>
                                        <Form id={thresholdForm.id} onSubmit={boxfitForm.onSubmit}>
                                            <div className="flex flex-row justify-between mt-6 mb-2">
                                                <Label htmlFor={thresholdFields.adaptiveBlockSize.id}>Adaptive Block Size</Label>
                                                <CardDescription>{adaptiveBlockSliderValue}</CardDescription>
                                            </div>
                                            <Slider
                                                defaultValue={[Number(adaptiveBlockSize)]}
                                                min={-25}
                                                max={25}
                                                step={1}
                                                onValueChange={(value: number[]) => setAdaptiveBlockSliderValue(value[0])}
                                            />
                                            <div className="flex flex-row justify-between mt-4 mb-2">
                                                <Label htmlFor={thresholdFields.adaptiveC.id}>Adaptive <span className="italic">C</span>-Value</Label>
                                                <CardDescription>{adaptiveCSliderValue}</CardDescription>
                                            </div>
                                            <Slider
                                                defaultValue={[Number(adaptiveC)]}
                                                min={-10}
                                                max={10}
                                                step={1}
                                                onValueChange={(value: number[]) => setAdaptiveCSliderValue(value[0])}
                                            />
                                            <div className="flex flex-row">
                                                <Button type="submit" variant="secondary" className="flex flex-row justify-between items-center space-x-2 mt-6 h-8 p-4 px-3 pr-2 text-sm w-full">
                                                    Perform new analysis
                                                    <CornerDownLeft className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </Form>
                                    </FormProvider>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="minor">
                    <div className="flex flex-row justify-between items-center">
                        <TabsList>
                            <TabsTrigger value="minor">Minor Axis</TabsTrigger>
                            <TabsTrigger value="major">Major Axis</TabsTrigger>
                        </TabsList>
                        <div className="flex flex-row space-x-2">
                            <Button variant="secondary" className="w-8 h-8 p-2 hover:text-green-500" onClick={() => onDownload(true)}>
                                <FileSpreadsheet />
                            </Button>
                            <Popover>
                                <PopoverTrigger>
                                    <Button asChild variant="outline" className="w-8 h-8 p-2">
                                        <Filter />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96">
                                    <div className="space-y-4">
                                        <div className="mb-6">
                                            <p className="font-semibold text-lg">
                                                Filter
                                            </p>
                                            <CardDescription className="text-sm">
                                                Refine hailpad dent data.
                                            </CardDescription>
                                        </div>
                                        <FormProvider context={filterForm.context}>
                                            <Form id={filterForm.id} onSubmit={filterForm.onSubmit}>
                                                <div className="flex flex-row items-center mt-1 justify-between text-sm">
                                                    <Input
                                                        className="w-20 h-8"
                                                        type="number"
                                                        key={filterFields.minMinor.key}
                                                        name={filterFields.minMinor.name}
                                                        // defaultValue={filterFields.minMinor.initialValue} TODO
                                                        placeholder="Min."
                                                        step="any"
                                                    />
                                                    <p>≤</p>
                                                    <p>Minor Axis (mm)</p>
                                                    <p>≤</p>
                                                    <Input
                                                        className="w-20 h-8"
                                                        type="number"
                                                        key={filterFields.maxMinor.key}
                                                        name={filterFields.maxMinor.name}
                                                        // defaultValue={filterFields.maxMinor.initialValue} TODO
                                                        placeholder="Max."
                                                        step="any"
                                                    />
                                                </div>
                                                <div className="flex flex-row items-center mt-2 justify-between text-sm">
                                                    <Input
                                                        className="w-20 h-8"
                                                        type="number"
                                                        key={filterFields.minMajor.key}
                                                        name={filterFields.minMajor.name}
                                                        // defaultValue={filterFields.minMajor.initialValue} TODO
                                                        placeholder="Min."
                                                        step="any"
                                                    />
                                                    <p>≤</p>
                                                    <p>Major Axis (mm)</p>
                                                    <p>≤</p>
                                                    <Input
                                                        className="w-20 h-8"
                                                        type="number"
                                                        key={filterFields.maxMajor.key}
                                                        name={filterFields.maxMajor.name}
                                                        // defaultValue={filterFields.maxMajor.initialValue} TODO
                                                        placeholder="Max."
                                                        step="any"
                                                    />
                                                </div>
                                                <div className="text-sm text-primary/60">
                                                    <p>{filterFields.minMinor.errors}</p>
                                                    <p>{filterFields.maxMinor.errors}</p>
                                                    <p>{filterFields.minMajor.errors}</p>
                                                    <p>{filterFields.maxMajor.errors}</p>
                                                </div>
                                                <div className="flex flex-row mt-6 justify-between">
                                                    <Button type="reset" variant="secondary" className="w-8 h-8 p-2">
                                                        <FilterX />
                                                    </Button>
                                                    <Button type="submit" variant="secondary" className="w-8 h-8 p-2">
                                                        <CornerDownLeft />
                                                    </Button>
                                                </div>
                                            </Form>
                                        </FormProvider>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <TabsContent value="minor">
                        <DetailSection min={minMinor} max={maxMinor} avg={avgMinor} />
                        <Histogram data={dentData.map((dent) => Number(dent.minorAxis))} />
                    </TabsContent>
                    <TabsContent value="major">
                        <DetailSection min={minMajor} max={maxMajor} avg={avgMajor} />
                        <Histogram data={dentData.map((dent) => Number(dent.majorAxis))} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
