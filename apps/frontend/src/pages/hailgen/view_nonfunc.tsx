import Head from 'next/head';
import { NextPage } from 'next';
import Header from '@/components/header';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';
import { api } from '@/utils/api';
import { useEffect, useRef, useState } from 'react';
import { HailpadControls, HailpadDetails, IndentDetails } from '@/components/hailgen-cards';
import { HailgenControls } from '@/components/dialogs/info-dialogs';

const View: NextPage = () => {
    const session = useSession();
    const router = useRouter();

    // if (!scan.data || scan.isLoading || !scan.data?.scan_location) {
    //     return (
    //         <>
    //             <Head>
    //                 <title>NHP Hailgen - View</title>
    //                 <meta name="description" content="Generated by create-t3-app" />
    //                 <link rel="icon" href="/favicon.ico" />
    //             </Head>
    //             <main className="h-screen">
    //                 <Header
    //                     title={
    //                         <>
    //                             NHP <span className="text-success">Hailgen</span>
    //                         </>
    //                     }
    //                     session={session.data}
    //                 />
    //                 <Toaster />
    //                 <div className="h-screen w-screen">
    //                     <div className="grid lg:grid-cols-4">
    //                         <div className="col-span-3 border-2 border-white">
    //                             <Skeleton className="h-48" />
    //                         </div>
    //                         <div>
    //                             <Skeleton />
    //                         </div>
    //                     </div>
    //                 </div>
    //             </main>
    //         </>
    //     );
    // }

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
                    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
                        <div className="row-span-2 overflow-hidden rounded-md lg:col-span-4 border-[1px]">
                            Depth map here
                        </div>
                        <div className="col-span-2">
                            <HailpadDetails
                                map_size={/*scan.data?.scan_size*/ BigInt(1111111)}
                                indent_count={57}
                                min_len={1}
                                max_len={10}
                                avg_len={5}
                                min_wid={2}
                                max_wid={11}
                                avg_wid={7}
                                min_vol={1}
                                max_vol={1000}
                                avg_vol={625}
                            />
                        </div>
                        <div className="col-span-2">
                            <IndentDetails
                                indent_count={57}
                                len={5}
                                wid={7}
                                vol={625}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default View;
