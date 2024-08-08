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
import { Form } from '@remix-run/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { Separator } from '~/components/ui/separator';
import { Slider } from '~/components/ui/slider';

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

function createBoxfitSchema() {
    return z.object({
        boxfit: z.number().min(0, {
            message: 'Box-fitting length must be positive.'
        }),
    });
}

function createMaxDepthSchema() {
    return z.object({
        maxDepth: z.number().min(0, {
            message: 'Max. depth length must be positive.'
        }),
    });
}

function createThresholdSchema() {
    return z.object({
        adaptiveBlock: z.number().min(-25, {
            message: 'Adaptive block size must be at least -25.'
        }),
        adaptiveC: z.number().min(-10, {
            message: 'Adaptive C-value must be at least -10.'
        }),
    });
}

function createFilterSchema() {
    return z.object({
        minMinor: z.number().min(0, {
            message: 'Lower bound of minor axis must be positive.'
        }),
        maxMinor: z.number().min(0, {
            message: 'Upper bound of minor axis must be greater than lower bound.'
        }),
        minMajor: z.number().min(0, {
            message: 'Lower bound of major axis must be positive.'
        }),
        maxMajor: z.number().min(0, {
            message: 'Upper bound of major axis must be greater than lower bound.'
        })
    }).refine(data => data.maxMinor > data.minMinor, {
        path: ['maxMinor'], // path to the error
        message: 'Upper bound of minor axis must be greater than lower bound.'
    }).refine(data => data.maxMajor > data.minMajor, {
        path: ['maxMajor'], // path to the error
        message: 'Upper bound of major axis must be greater than lower bound.'
    });
}

export default function HailpadDetails({
    dentData,
    boxfit,
    maxDepth,
    adaptiveBlockSize,
    adaptiveC,
    onFilterChange,
    onShowCentroids,
    onDownload
}: {
    dentData: HailpadDent[];
    boxfit: string;
    maxDepth: string;
    adaptiveBlockSize: string;
    adaptiveC: string;
    onFilterChange: (value: { minMinor: number; maxMinor: number; minMajor: number; maxMajor: number; }) => void;
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

    const [isShowCentroidChecked, setIsShowCentroidChecked] = useState<boolean>(false);

    // TODO: Minimize code duplication (?)
    const [boxfitForm, boxfitFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createBoxfitSchema() });
        },
        onSubmit() {
            const formData = new FormData();
            formData.append(boxfitFields.boxfit.name, boxfitFields.boxfit.value || "");
        }
    });

    const [maxDepthForm, maxDepthFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createMaxDepthSchema() });
        },
        onSubmit() {
            const formData = new FormData();
            formData.append(maxDepthFields.maxDepth.name, maxDepthFields.maxDepth.value || "");
        }
    });

    const [thresholdForm, thresholdFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createThresholdSchema() });
        },
        onSubmit() {
            const formData = new FormData();
            formData.append(thresholdFields.adaptiveBlock.name, thresholdFields.adaptiveBlock.value || "");
            formData.append(thresholdFields.adaptiveC.name, thresholdFields.adaptiveC.value || "");
        }
    });

    const [filterForm, filterFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createFilterSchema() });
        },
        onSubmit() {
            // TODO: Don't create needless query params
            onFilterChange({
                minMinor: Number(filterFields.minMinor.value) || 0,
                maxMinor: Number(filterFields.maxMinor.value) || Infinity,
                minMajor: Number(filterFields.minMajor.value) || 0,
                maxMajor: Number(filterFields.maxMajor.value) || Infinity,
            });
        }
    });

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
                                            checked={isShowCentroidChecked}
                                            onClick={() => setIsShowCentroidChecked(!isShowCentroidChecked)}
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
                                        <Form method="post" id={boxfitForm.id} onSubmit={boxfitForm.onSubmit}>
                                            <div className="flex flex-row items-center mt-1">
                                                <div className="w-48 mr-4">
                                                    <Label>Box-fitting Length (mm)</Label>
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
                                        </Form>
                                    </FormProvider>
                                    <FormProvider context={maxDepthForm.context}>
                                        <Form method="post" id={maxDepthForm.id} onSubmit={maxDepthForm.onSubmit}>
                                            <div className="flex flex-row items-center mt-1">
                                                <div className="w-48 mr-4">
                                                    <Label htmlFor={maxDepthFields.maxDepth.id}>Maximum Depth (mm)</Label>
                                                </div>
                                                <Input
                                                    className="w-20 h-8 mr-4"
                                                    type="number"
                                                    key={maxDepthFields.maxDepth.key}
                                                    name={maxDepthFields.maxDepth.name}
                                                    defaultValue={maxDepthFields.maxDepth.initialValue}
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
                                        <Form id={thresholdForm.id} method="post" onSubmit={thresholdForm.onSubmit}>
                                            <div className="flex flex-row justify-between mt-6 mb-2">
                                                <Label htmlFor={thresholdFields.adaptiveBlock.id}>Adaptive Block Size</Label>
                                                <CardDescription>{adaptiveBlockSliderValue}</CardDescription>
                                            </div>
                                            <Slider
                                                defaultValue={[Number(adaptiveBlockSize)]}
                                                key={thresholdFields.adaptiveBlock.key}
                                                name={thresholdFields.adaptiveBlock.name}
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
                                                key={thresholdFields.adaptiveC.key}
                                                name={thresholdFields.adaptiveC.name}
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
                                            <Form
                                                id={filterForm.id}
                                                onReset={() => {
                                                    onFilterChange({
                                                        minMinor: 0,
                                                        maxMinor: Infinity,
                                                        minMajor: 0,
                                                        maxMajor: Infinity
                                                    });
                                                }}
                                                onSubmit={filterForm.onSubmit}
                                            >
                                                <div className="flex flex-row items-center mt-1 justify-between text-sm">
                                                    <Input
                                                        className="w-20 h-8"
                                                        type="number"
                                                        key={filterFields.minMinor.key}
                                                        name={filterFields.minMinor.name}
                                                        defaultValue={filterFields.minMinor.initialValue}
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
                                                        defaultValue={filterFields.maxMinor.initialValue}
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
                                                        defaultValue={filterFields.minMajor.initialValue}
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
                                                        defaultValue={filterFields.maxMajor.initialValue}
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
