import { useEffect, useState } from 'react';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const chartConfig = {
    count: {
        label: "Count",
        color: "#8F55E0",
    }
} satisfies ChartConfig

export default function Histogram({
    data
}: {
    data: number[];
}) {
    const [binnedData, setBinnedData] = useState<{ bin: string; count: number }[]>([]);

    useEffect(() => {
        data = data.filter(val => val <= 100); // TODO: Remove

        const bins: { bin: string; count: number }[] = [];

        if (!data) return;

        const min = Math.floor(Math.min(...data) / 5) * 5;
        const max = Math.ceil(Math.max(...data) / 5) * 5;

        // Create bins in increments of 5
        for (let i = min; i < max; i += 5) {
            bins.push({ bin: `[${i}, ${i + 5})`, count: 0 });
        }

        // Populate bins
        data.forEach(num => {
            const binIndex = Math.floor(num / 5);
            bins[binIndex - min / 5].count += 1;
        });

        setBinnedData(bins);
    }, [data]);

    return (
        data &&
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer  data={binnedData}>
                <CartesianGrid horizontal={false} />
                <XAxis
                    dataKey="bin"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={true}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
