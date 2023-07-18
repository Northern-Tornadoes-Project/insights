import type { GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import { useSession } from 'next-auth/react';
import { columns } from '../../components/data-tables/paths/columns';
import { DataTable } from '@/components/data-tables/paths/data-table';
import { NewPathDialog } from '@/components/dialogs/new-path/dialog';
import { ntpProtectedRoute } from '@/lib/protectedRoute';
import ServerStatusBadge from '@/components/server-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api';
import { UploadInfo } from '@/components/dialogs/info-dialogs';

const Dashboard: NextPage = () => {
	const session = useSession();
	const paths = api.paths.getAllPublic.useQuery();

	return (
		<>
			<Head>
				<title>NTP 360</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="h-screen">
				<Header
					title={
						<p>
							NTP <span className="text-success">360</span>
						</p>
					}
					session={session.data}
				/>
				<Toaster />
				<div className="container flex flex-col p-6">
					<div className="flex flex-row items-center space-x-4 pb-6">
						<h3 className=" text-2xl font-semibold">Event Paths</h3>
						<ServerStatusBadge />
						<div className="flex w-9/12 flex-grow flex-row items-center justify-end space-x-4 text-end">
							<UploadInfo />
							<NewPathDialog />
						</div>
					</div>
					{paths.isLoading && (
						<div className="flex flex-col items-center justify-center">
							<Skeleton className="h-96 w-full" />
						</div>
					)}
					{paths.data && (
						<DataTable
							columns={columns(() => void paths.refetch())}
							data={paths.data.sort((a, b) => {
								if (a.date < b.date) {
									return 1;
								}
								if (a.date > b.date) {
									return -1;
								}
								return 0;
							})}
						/>
					)}
				</div>
			</main>
		</>
	);
};

export default Dashboard;

export async function getServerSideProps(context: GetServerSidePropsContext) {
	return await ntpProtectedRoute(context);
}
