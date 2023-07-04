import 'mapbox-gl/dist/mapbox-gl.css';
import { type FormEvent } from 'react';
import { type GetServerSidePropsContext } from 'next';
import { type SearchData } from '@/utils/types/searchData';
import { type DateRange } from 'react-day-picker';
import Head from 'next/head';
import Header from '@/components/header';
import ServerStatusBadge from '@/components/server-status-badge';
import { CalendarDateRangePicker } from '@/components/ui/calendar-range';
import { NewSearchMapCard } from '@/components/maps';
import { Controller, useForm } from 'react-hook-form';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { addDays } from 'date-fns';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { useRouter } from 'next/router';
import { KeywordInput } from '@/components/input/keyword-input';
import { KeywordsInfo } from '@/components/dialogs/info-dialogs';
import { useWebSocketContext } from '@/components/socket-context';
import { ntpProtectedRoute } from '@/lib/protectedRoute';
import { useSession } from 'next-auth/react';
import { Toggle } from '@/components/ui/toggle';
import { LucideFacebook, LucideTwitter } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const NewSearchPage = () => {
	const session = useSession();
	const router = useRouter();
	const search = api.searches.new.useMutation();
	const { register, handleSubmit, control, formState } = useForm<SearchData>();
	const websocketInstance = useWebSocketContext();

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleSubmit(async (data) => {
			if (websocketInstance.state !== WebSocket.OPEN) {
				return toast({
					title: 'Error',
					description: 'Websocket is not connected. Please try again later.',
					variant: 'destructive',
					duration: 5000,
				});
			}

			try {
				const result = await search.mutateAsync(data);

				if (!result) {
					return toast({
						title: 'Error',
						description: `An error occurred while creating the search.`,
						variant: 'destructive',
						duration: 5000,
					});
				}

				toast({
					title: 'Search Created',
					description: result.message,
					variant: 'default',
					duration: 5000,
				});

				if (!websocketInstance.socket) {
					return;
				}

				await new Promise((resolve) => {
					console.log('sending refresh')
					websocketInstance.socket.send('refresh');
					setTimeout(resolve, 1000);
				});
				
				return router.push(`/social/${result.id}/view`);
			} catch (error) {
				return toast({
					title: 'Error',
					description: error.message,
					variant: 'destructive',
					duration: 5000,
				});
			}
		})(event);
	};

	return (
		<>
			<Head>
				<title>New Search</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="h-screen">
				<Toaster />
				<Header title="New Search" session={session.data} />
				<div className="container flex flex-col items-center justify-center p-6">
					<div className="flex w-full flex-row items-center">
						<ServerStatusBadge />
					</div>
					<form
						onSubmit={onSubmit}
						className="grid w-full grid-cols-1 gap-4 py-8 lg:grid-cols-5"
					>
						<Controller
							control={control}
							name="map"
							defaultValue={{
								lng: -81.3,
								lat: 42.97,
								keywords: [
									'storm',
									'tornado',
									'twister',
									'@weathernetwork',
									'@NTP_Reports',
									'funnel cloud',
									'tornado warning',
									'hurricane',
								],
							}}
							render={({ field: { onChange, value } }) => (
								<NewSearchMapCard
									title="Map"
									description="Select a region to search."
									className="min-w-[300px] lg:col-span-3"
									value={{
										lng: value.lng || 0,
										lat: value.lat || 0,
										keywords: [],
									}}
									onChange={onChange}
								/>
							)}
						/>
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Search Parameters</CardTitle>
								<CardDescription>Edit the search parameters.</CardDescription>
							</CardHeader>
							<CardContent className="mb-4 flex w-full flex-col gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="name">Search Name</Label>
									<div className="m-2">
										<Input
											id="name"
											placeholder="Name"
											type="text"
											className="w-full"
											disabled={formState.isSubmitting}
											{...register('name', {
												required: true,
												disabled: formState.isSubmitting,
											})}
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="date">Date Range</Label>
									<div className="m-2">
										<Controller
											control={control}
											name="dateRange"
											rules={{ required: true }}
											defaultValue={{
												from: new Date(),
												to: addDays(new Date(), 2),
											}}
											render={({ field: { onChange, value } }) => (
												<CalendarDateRangePicker
													className="w-full"
													onChange={onChange}
													value={value as DateRange}
												/>
											)}
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label className="flex flex-row items-center gap-2">
										<p>Keywords</p>
										<KeywordsInfo />
									</Label>
									<div className="m-2">
										<Controller
											control={control}
											name="keywords"
											defaultValue={[
												'storm',
												'tornado',
												'twister',
												'@weathernetwork',
												'@NTP_Reports',
												'funnel cloud',
												'tornado warning',
												'hurricane',
											]}
											rules={{ required: true, minLength: 1, maxLength: 100 }}
											render={({ field: { onChange, value, onBlur, ref } }) => {
												return (
													<KeywordInput
														onChange={onChange}
														value={value}
														onBlur={onBlur}
														inputRef={ref}
														disabled={formState.isSubmitting}
													/>
												);
											}}
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label className="flex flex-row items-center gap-2">
										<p>Negative Keywords</p>
										<KeywordsInfo />
									</Label>
									<div className="m-2">
										<Controller
											control={control}
											name="negativeKeywords"
											defaultValue={[
												'warning',
												'RT',
												'investigate',
												'false',
												'winter',
												'snow',
											]}
											rules={{ required: true, minLength: 1, maxLength: 100 }}
											render={({ field: { onChange, value, onBlur, ref } }) => {
												return (
													<KeywordInput
														onChange={onChange}
														value={value}
														onBlur={onBlur}
														inputRef={ref}
														disabled={formState.isSubmitting}
													/>
												);
											}}
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label>Frequency</Label>
									<div className="m-2">
										<Controller
											control={control}
											name="frequency"
											defaultValue={24}
											render={({ field: { onChange, value, ref } }) => (
												<div className="my-2 flex flex-row">
													<Slider
														id="frequency"
														ref={ref}
														min={6}
														max={48}
														step={0.5}
														className="w-full flex-grow"
														onValueChange={(val) => onChange(val[0])}
														value={[value]}
													/>
													<p className="text-muted-foreground mx-2 w-32 select-none whitespace-nowrap text-right">
														{value} hours
													</p>
												</div>
											)}
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="maxResults">Max Results</Label>
									<div className="m-2">
										<Input
											id="maxResults"
											placeholder="50"
											defaultValue={50}
											min="10"
											max="100"
											step="1"
											type="number"
											className="w-full"
											{...register('maxResults', {
												required: true,
												valueAsNumber: true,
												disabled: formState.isSubmitting,
											})}
										/>
									</div>
								</div>
								<div className="mb-2 flex h-12 flex-col gap-2">
									<Label>Toggle Platforms</Label>
									<div className="m-2 flex flex-row gap-2">
										<Controller
											control={control}
											name="facebook"
											defaultValue={false}
											render={({ field: { onChange, value, ref } }) => (
												<Toggle
													id="facebook"
													pressed={value}
													onPressedChange={onChange}
													ref={ref}
													variant="outline"
													aria-label="Toggle Facebook"
												>
													<LucideFacebook />
												</Toggle>
											)}
										/>
										<Separator orientation="vertical" />
										<Controller
											control={control}
											name="twitter"
											defaultValue={true}
											render={({ field: { onChange, value, ref } }) => (
												<Toggle
													id="twitter"
													pressed={value}
													onPressedChange={onChange}
													ref={ref}
													variant="outline"
													aria-label="Toggle Twitter"
												>
													<LucideTwitter />
												</Toggle>
											)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
						<Button
							formAction="submit"
							className="col-span-full lg:col-span-2 lg:col-start-4 lg:col-end-6"
							disabled={formState.isSubmitting}
						>
							Submit
						</Button>
					</form>
				</div>
			</main>
		</>
	);
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
	return await ntpProtectedRoute(context);
}

export default NewSearchPage;
