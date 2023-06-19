import { useRouter } from 'next/router';
import { type GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import { DownloadButton } from '@/components/buttons/download-button';
import StatCard from '@/components/stat-card';
import { SearchViewMapCard, SearchViewBox } from '@/components/maps';
import ServerStatusBadge from '@/components/server-status-badge';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Toaster } from '@/components/ui/toaster';
import { api } from '@/utils/api';
import { ntpProtectedRoute } from '@/lib/protectedRoute';
import { type Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
	ClassificationComparisonGraph,
	SearchGraph,
	breakPostsIntoIntervals,
} from '@/components/graphs/search-graph';
import { DataTable } from '@/components/data-tables/posts/data-table';
import { columns } from '@/components/data-tables/posts/columns';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ViewSearchPage = () => {
	const session = useSession();
	const router = useRouter();
	const {
		id,
	}: {
		id?: string;
	} = router.query;

	const search = api.searches.get.useQuery({ id: id || '' });
	const searchResults = api.searchResults.getAllForSearch.useQuery({
		id: id || '',
	});

	if (search.isLoading) {
		return <LoadingView session={session.data} />;
	} else if (search.isError) {
		return <div>Error: {search.error.message}</div>;
	} else if (!search.data) {
		return <div>Not found</div>;
	} else if (!search.data.results.length) {
		return <NoResultsView session={session.data} onRefresh={() => {
			search.refetch();
			searchResults.refetch();
		}} />;
	}

	const postIntervals = breakPostsIntoIntervals(
		searchResults.data
			?.map((result) => result.posts)
			.flat()
			.sort((a, b) => {
				return (
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				);
			}),
		// Every 3 hours
		1000 * 60 * 60 * 3
	);

	const postsOverTimeData = postIntervals.map((interval) => {
		return {
			label: new Date(interval[0].created_at).toLocaleString('en-US', {
				month: 'short',
				day: '2-digit',
				hour: 'numeric',
				minute: 'numeric',
			}),
			stat: interval.length,
		};
	});

	const classificationsOverTimeData = postIntervals.map((interval) => {
		return {
			label: new Date(interval[0].created_at).toLocaleString('en-US', {
				month: 'short',
				day: '2-digit',
				hour: 'numeric',
				minute: 'numeric',
			}),
			relevant: interval.filter(
				(post) => post.category?.toLowerCase() === 'relevant' || false
			).length,
			irrelevant: interval.filter(
				(post) => post.category?.toLowerCase() === 'irrelevant' || false
			).length,
		};
	});

	return (
		<>
			<Head>
				<title>{`${search.data?.name || 'View Search'}`}</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="h-screen">
				<Header
					title={`${search.data?.name || 'View Search'}`}
					session={session.data}
				/>
				<Toaster />
				<div className="container flex flex-col items-center justify-center p-6">
					<div className="flex w-full flex-row items-center justify-between">
						<ServerStatusBadge />
						<div className="flex flex-row items-center gap-4">
							<Button variant="secondary">Edit</Button>
							<DownloadButton />
						</div>
					</div>
					<div className="grid w-full grid-cols-1 gap-4 py-8 md:grid-cols-5">
						<SearchGraph
							title="Posts Over Time"
							description="Number of posts over time"
							data={postsOverTimeData}
							className="col-span-full row-span-2 lg:col-span-4"
						/>
						<StatCard
							title="Relevant Posts"
							description="Total number of relevant posts"
							className="md:col-span-3 lg:col-span-1"
						>
							<h2 className="text-success text-4xl font-bold">
								{
									searchResults.data
										?.map((result) => result.posts.map((post) => post.category))
										.flat()
										.filter((category) => category?.toLowerCase() === 'relevant' || false)
										.length
								}
							</h2>
						</StatCard>
						<StatCard
							title="Total Posts"
							description="Number of unique posts found"
							className="md:col-span-2 lg:col-span-1"
						>
							<h2 className="text-4xl font-bold">
								{searchResults.data
									?.map((result) => result.posts.length)
									.reduce((a, b) => a + b, 0)}
							</h2>
						</StatCard>
						<ClassificationComparisonGraph
							title="Classification Comparison"
							description="Comparison of relevant and irrelevant posts"
							data={classificationsOverTimeData}
							className="col-span-full row-span-2 lg:col-span-4"
						/>
						<StatCard
							title="Total Results"
							description="Number of queries made"
							className="md:col-span-2 lg:col-span-1"
						>
							<h2 className="text-4xl font-bold">
								{search.data?._count.results}
							</h2>
						</StatCard>
						<StatCard
							title="Total Users"
							description="Number of unique users found"
							className="md:col-span-3 lg:col-span-1"
						>
							<h2 className="text-4xl font-bold">
								{
									searchResults.data
										?.map((result) => result.posts.map((post) => post.author))
										.flat()
										.filter(
											(user, index, self) =>
												self.findIndex((u) => u === user) === index
										).length
								}
							</h2>
						</StatCard>
						<Card className="col-span-full row-span-2 lg:col-span-5">
							<CardHeader>
								<CardTitle>Posts</CardTitle>
								<CardDescription>
									Posts that were found by the search.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<DataTable
									columns={columns}
									data={searchResults.data.map((result) => result.posts).flat()}
								/>
							</CardContent>
						</Card>
						<SearchViewMapCard
							title="Locations"
							description="Places where posts were made. This data is based on the location data provided by Twitter."
							className="min-w-[400px] md:col-span-full md:row-span-4"
							start={{
								lng: search.data.longitude,
								lat: search.data.latitude,
							}}
							boxes={search.data.results
								.map((result) => {
									return result.location.map((location) => {
										return {
											id: location['id'],
											geo: location['geo'],
											country: location['country'],
											full_name: location['full_name'],
											country_code: location['country_code'],
										} as SearchViewBox;
									});
								})
								.flat()
								.filter(
									(box, index, self) =>
										self.findIndex((b) => b.id === box.id) === index
								)}
						/>
					</div>
				</div>
			</main>
		</>
	);
};

function LoadingView(props: { session: Session }) {
	return (
		<>
			<Head>
				<title>View Search</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="h-screen">
				<Header title={'View Search'} session={props.session} />
				<Toaster />
				<div className="container flex flex-col items-center justify-center p-6">
					<div className="flex w-full flex-row items-center justify-between">
						<ServerStatusBadge />
						<div className="flex flex-row items-center gap-4">
							<Button variant="secondary">Edit</Button>
							<DownloadButton />
						</div>
					</div>
					<div className="grid w-full grid-cols-1 gap-4 py-8 md:grid-cols-5">
						<Skeleton className="col-span-full row-span-2 min-h-[332px] lg:col-span-4" />
						<Skeleton className="min-h-[161px] md:col-span-3 lg:col-span-1" />
						<Skeleton className="min-h-[161px] md:col-span-2 lg:col-span-1" />
						<Skeleton className="col-span-full row-span-2 min-h-[332px] lg:col-span-4" />
						<Skeleton className="min-h-[161px] md:col-span-2 lg:col-span-1" />
						<Skeleton className="min-h-[161px] md:col-span-3 lg:col-span-1" />
						<Skeleton className="col-span-full row-span-2 min-h-[332px] lg:col-span-5" />
						<Skeleton className="min-h-[332px] min-w-[400px] md:col-span-full md:row-span-4" />
					</div>
				</div>
			</main>
		</>
	);
}

function NoResultsView(props: { session: Session, onRefresh: () => void }) {
	return (
		<>
			<Head>
				<title>View Search</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="h-screen">
				<Header title={'View Search'} session={props.session} />
				<Toaster />
				<div className="container flex flex-col items-center justify-center p-6">
					<div className="flex w-full flex-row items-center justify-between">
						<ServerStatusBadge />
						<div className="flex flex-row items-center gap-4">
							<Button variant="secondary">Edit</Button>
							<DownloadButton />
						</div>
					</div>
					<div className="flex flex-col items-center justify-center gap-4">
						<h2 className="text-xl">Search not run yet...</h2>
						<Button variant="secondary" onClick={props.onRefresh}>Refresh</Button>
					</div>
				</div>
			</main>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	return await ntpProtectedRoute(context);
}

export default ViewSearchPage;
