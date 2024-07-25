import { FileSpreadsheet, Filter, Settings } from 'lucide-react';
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
    fetcher,
    onFilterChange,
    onShowCentroids,
    // onBoxfitChange,
    onDownload
}: {
    dentData: HailpadDent[];
    fetcher: any;
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

    // const submit = useSubmit();
    const [boxfitForm, boxfitFields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: createSchema() });
        },
        onSubmit() {
            const formData = new FormData();
            formData.append(boxfitFields.boxfit.name, boxfitFields.boxfit.value || "");
            console.log(formData);
            fetcher.submit(formData, { method: "POST"});
        }
    });

    // const fetcher = useFetcher();
    // const formData = new FormData();
    // fetcher.submit(event.currentTarget.form, { method: "post" });

    useEffect(() => {
        setMinMinor(Math.min(...dentData.map((dent) => Number(dent.minorAxis))));
        setMaxMinor(Math.max(...dentData.map((dent) => Number(dent.minorAxis))));

        setMinMajor(Math.min(...dentData.map((dent) => Number(dent.majorAxis))));
        setMaxMajor(Math.max(...dentData.map((dent) => Number(dent.majorAxis))));

        setAvgMinor(dentData.reduce((acc, dent) => acc + Number(dent.minorAxis), 0) / dentData.length);
        setAvgMajor(dentData.reduce((acc, dent) => acc + Number(dent.majorAxis), 0) / dentData.length);
    }, [dentData]);

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
                            <PopoverContent className="w-60">
                                <div className="space-y-4">
                                    <p className="font-semibold text-sm">
                                        Hailpad View Settings
                                    </p>
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
                                        <Form id={boxfitForm.id} onSubmit={boxfitForm.onSubmit}>
                                            <div>
                                                <Label htmlFor={boxfitFields.boxfit.id}>Box-fitting Length</Label>
                                                <Input
                                                    type="number"
                                                    key={boxfitFields.boxfit.key}
                                                    name={boxfitFields.boxfit.name}
                                                    defaultValue={boxfitFields.boxfit.initialValue}
                                                    placeholder=""
                                                    step="any"
                                                />
                                                <p className="text-sm text-primary/60">{boxfitFields.boxfit.errors}</p>
                                            </div>
                                            <Button type="submit">Next</Button>
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
                                <PopoverContent>
                                    TODO
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
