import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

interface HailpadDent { // TODO: Use shared interface
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

export default function DentDetails({
    dentData,
    index,
    onPrevious,
    onNext,
    onIndexChange
}: {
    dentData: HailpadDent[];
    index: number,
    onPrevious?: () => void;
    onNext?: () => void;
    onIndexChange: (index: number) => void;
}) {
    const [minor, setMinor] = useState<number>(0);
    const [major, setMajor] = useState<number>(0);

    useEffect(() => {
        if (dentData.length === 0) return;
        setMinor(Number(dentData[index].minorAxis));
        setMajor(Number(dentData[index].majorAxis));
    }, [dentData, index]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dent Details</CardTitle>
                <CardDescription>About the selected dent.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 mt-4" >
                <Detail
                    label="Minor Axis"
                    value={`${minor.toFixed(2)} mm`}
                />
                <Detail
                    label="Major Axis"
                    value={`${major.toFixed(2)} mm`}
                />
            </CardContent>
        </Card >
    );
}
