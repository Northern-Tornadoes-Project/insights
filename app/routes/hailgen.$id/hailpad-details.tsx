import { FileSpreadsheet, Filter, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
// import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import Histogram from './histogram';

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

export default function HailpadDetails({
    dentData,
    onFilterChange,
    onShowCentroids,
    onDownload
}: {
    dentData: HailpadDent[];
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
                                {/* <Button variant="outline" className="w-8 h-8 p-2">
                                    <Settings />
                                </Button> */}
                            </PopoverTrigger>
                            <PopoverContent>
                                TODO
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
                            {/* <Button variant="secondary" className="w-8 h-8 p-2 hover:text-green-500" onClick={() => onDownload(true)}>
                                <FileSpreadsheet />
                            </Button> */}
                            <Popover>
                                <PopoverTrigger>
                                    {/* <Button variant="outline" className="w-8 h-8 p-2">
                                        <Filter />
                                    </Button> */}
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
