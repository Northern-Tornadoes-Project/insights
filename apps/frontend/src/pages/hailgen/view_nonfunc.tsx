import Head from 'next/head';
import { NextPage } from 'next';
import Header from '@/components/header';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';
import { api } from '@/utils/api';
import { useEffect, useState } from 'react';
import { HailpadDetails, HailpadMap, IndentDetails } from '@/components/hailgen-cards';
import { HailgenControls } from '@/components/dialogs/info-dialogs';

const View: NextPage = () => {
    const session = useSession();
    const router = useRouter();

    const conversionFactor = 1639.34426 / 1000; // px/mm TODO: Replace with actual conversion factor from backend

    const [currentIndex, setCurrentIndex] = useState(0);
    const [originalCentroids, setOriginalCentroids] = useState<Array<[number, number]>>([]);
    const [centroids, setCentroids] = useState<Array<[number, number]>>([]);
    const [download, setDownload] = useState(false);
    const [originalData, setOriginalData] = useState<{
        indents: {
            area: number;
            major_axis: number;
            minor_axis: number;
            centroid: {
                y: number;
                x: number;
            };
            depth_at_centroid: number;
            avg_depth: number;
            max_depth: number;
        }[];
        img: string;
    }>({
        indents: [],
        img: '',
    });
    const [scanData, setScanData] = useState<{
        indents: {
            area: number;
            major_axis: number;
            minor_axis: number;
            centroid: {
                y: number;
                x: number;
            };
            depth_at_centroid: number;
            avg_depth: number;
            max_depth: number;
        }[];
        img: string;
    }>({
        indents: [],
        img: '',
    });
    const [filters, setFilters] = useState<{
        minMinor: number;
        maxMinor: number;
        minMajor: number;
        maxMajor: number;
        minVolume: number;
        maxVolume: number;
    }>({
        minMinor: undefined,
        maxMinor: undefined,
        minMajor: undefined,
        maxMajor: undefined,
        minVolume: undefined,
        maxVolume: undefined,
    });

    // Fetch scan data  TODO: Replace with backend API call
    useEffect(() => {
        fetch('/output.json')
            .then(response => response.json())
            .then(data => {
                const newCentroids = data.indents.map(indent => [indent.centroid.y, indent.centroid.x]);
                setOriginalData(data);
                setScanData(data);
                setOriginalCentroids(newCentroids);
                setCentroids(newCentroids);
            })
            .catch(error => console.error('Error fetching centroids: ', error));
    }, []);

    useEffect(() => {
        // Download CSV on download state change (download button clicked)
        if (download) {
            setDownload(false);
            downloadCSV();
        }
    }, [download]);

    useEffect(() => {
        // Reset scan data to original data on filter change (if any) to prepare for new filtering
        setScanData(originalData);
    }, [filters.minMinor, filters.maxMinor, filters.minMajor, filters.maxMajor, filters.minVolume, filters.maxVolume]);

    useEffect(() => {
        if (scanData === originalData) {
            let filteredIndents = scanData.indents;
            let filteredCentroids = originalCentroids;

            // Iterate through filters and apply them to scanData
            for (const [key, value] of Object.entries(filters)) {
                // If the filter is not set, the value will be undefined and the filter will not be applied
                if (value !== undefined && value !== 0) {
                    let valueType: string;

                    // Determine the type of value being filtered based on filter key
                    if (key === 'minMinor' || key === 'maxMinor') {
                        valueType = 'minor_axis';
                    } else if (key === 'minMajor' || key === 'maxMajor') {
                        valueType = 'major_axis';
                    } else if (key === 'minVolume' || key === 'maxVolume') {
                        valueType = 'volume';
                    }

                    console.log("Now filtering by: " + value + " and type: " + key + " and valueType: " + valueType); // TODO: Remove

                    // Filter the indents based on the filter key and value
                    const filterInPixels = value * conversionFactor;
                    filteredIndents = filteredIndents.filter(indent => key.startsWith('min') ? indent[valueType] >= filterInPixels : indent[valueType] <= filterInPixels);
                }
            }

            // Get the corresponding filtered centroids based on the final set of filtered indents
            const indices = filteredIndents.map(indent => filteredIndents.indexOf(indent));
            filteredCentroids = indices.map(index => filteredCentroids[index]);

            // Update the scanData and centroids with the filtered data
            setScanData({ ...scanData, indents: filteredIndents });
            setCentroids(filteredCentroids);
        }
    }, [scanData, filters.minMinor, filters.maxMinor, filters.minMajor, filters.maxMajor, filters.minVolume, filters.maxVolume]);

    // Download CSV of scanData indents
    const downloadCSV = () => {
        const headers = ['Area', 'Major Axis', 'Minor Axis', 'Centroid X', 'Centroid Y', 'Depth at Centroid', 'Average Depth', 'Max Depth'];
        const csvData = scanData.indents.map(indent => {
            return `${indent.area},${indent.major_axis},${indent.minor_axis},${indent.centroid.x},${indent.centroid.y},${indent.depth_at_centroid},${indent.avg_depth},${indent.max_depth}`;
        });
        csvData.unshift(headers.join(',')); // Add headers at the start of the array
        const csv = csvData.join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hailpad_data.csv';
        a.click();
    };

    return (
        <>
            <Head>
                <title>NHP Hailgen - View</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="h-screen">
                <Header
                    title={
                        <>
                            NHP <span className="text-success">Hailgen</span>
                        </>
                    }
                    session={session.data}
                />
                <Toaster />
                <div className="container flex flex-col items-center justify-center p-10">
                    <div className="mb-4 flex w-full flex-row items-center gap-4 text-left text-2xl font-medium">
                        <h2>{/*scan.data.name ||*/ 'Hailpad Scan Name'}</h2>
                        <HailgenControls />
                    </div>
                    <div className="flex flex-col space-y-4 lg:flex-none lg:flex-row lg:space-y-0 lg:space-x-4">
                        <div className="rounded-lg border-2 object-fit overflow-hidden">
                            <HailpadMap
                                index={currentIndex}
                                onIndexChange={setCurrentIndex}
                                imgData={scanData.img} centroids={centroids}
                            />
                        </div>
                        <div className="flex flex-col space-y-4">
                            <HailpadDetails
                                onFilterChange={setFilters}
                                onDownload={() => setDownload(true)}
                                indent_count={scanData.indents.length}
                                min_minor={scanData.indents.reduce((min, indent) => Math.min(min, indent.minor_axis), Infinity) / conversionFactor}
                                max_minor={scanData.indents.reduce((max, indent) => Math.max(max, indent.minor_axis), -Infinity) / conversionFactor}
                                avg_minor={scanData.indents.reduce((sum, indent) => sum + indent.minor_axis, 0) / scanData.indents.length / conversionFactor}
                                min_major={scanData.indents.reduce((min, indent) => Math.min(min, indent.major_axis), Infinity) / conversionFactor}
                                max_major={scanData.indents.reduce((max, indent) => Math.max(max, indent.major_axis), -Infinity) / conversionFactor}
                                avg_major={scanData.indents.reduce((sum, indent) => sum + indent.major_axis, 0) / scanData.indents.length / conversionFactor}
                                min_volume={NaN}
                                max_volume={NaN}
                                avg_volume={NaN}
                                minors={scanData.indents.map(indent => indent.minor_axis / conversionFactor)}
                                majors={scanData.indents.map(indent => indent.major_axis / conversionFactor)}
                                volumes={[NaN]}
                            />
                            {scanData.indents[currentIndex] &&
                                <IndentDetails
                                    onNext={() => {
                                        if (currentIndex + 1 < scanData.indents.length) {
                                            setCurrentIndex(currentIndex + 1);
                                        } else {
                                            setCurrentIndex(0);
                                        }
                                    }}
                                    onPrevious={() => {
                                        if (currentIndex - 1 >= 0) {
                                            setCurrentIndex(currentIndex - 1);
                                        } else {
                                            setCurrentIndex(scanData.indents.length - 1);
                                        }
                                    }}
                                    index={currentIndex}
                                    onIndexChange={setCurrentIndex}
                                    indent_count={scanData.indents.length}
                                    minor={scanData.indents[currentIndex].minor_axis / conversionFactor}
                                    major={scanData.indents[currentIndex].major_axis / conversionFactor}
                                    volume={NaN}
                                />
                            }
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default View;
