import { ChevronLeft, ChevronRight, CornerDownLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

interface HailpadDent {
    // TODO: Use shared interface
    angle: string | null;
    centroidX: string;
    centroidY: string;
    majorAxis: string;
    minorAxis: string;
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
                                    <Button asChild variant="outline" className="w-8 h-8 p-2">
                                        <Trash2 />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    TODO
                                </PopoverContent>
                            </Popover>
                            <Popover>
                                <PopoverTrigger>
                                    <Button asChild variant="outline" className="w-8 h-8 p-2">
                                        <Pencil />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    TODO
                                </PopoverContent>
                            </Popover>
                            <Popover>
                                <PopoverTrigger>
                                    <Button asChild variant="outline" className="w-8 h-8 p-2">
                                        <Plus />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    TODO
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-x-2">
                            <Button
                                className="w-8 h-8 p-2"
                                variant="secondary"
                                onClick={() => onPrevious?.()}
                            >
                                <ChevronLeft />

                            </Button>
                            <Button
                                className="w-8 h-8 p-2"
                                variant="secondary"
                                onClick={() => onNext?.()}
                            >
                                <ChevronRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="col-span-2">
                    <Detail label="Dent" />
                    <div className="flex flex-row items-center mt-1 gap-2">
                        <Input
                            className="w-20 h-8"
                            type="number"
                            min={1}
                            max={dentData.length}
                            placeholder={`${index + 1}`}
                            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                        />
                        <p>/</p>
                        <p>{`${dentData.length}`}</p>
                        <Button
                            className="w-8 h-8 p-2 ml-2"
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
                <div className="grid grid-cols-3 mt-4 gap-4">
                    <Detail label="Minor Axis" value={`${minor.toFixed(2)} mm`} />
                    <Detail label="Major Axis" value={`${major.toFixed(2)} mm`} />
                </div>
            </CardContent>
        </Card>
    );
}
