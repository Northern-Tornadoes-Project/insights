import '~/tailwind.css';

import { LoaderFunctionArgs } from '@remix-run/node';
import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLoaderData,
	useRouteError,
	useRouteLoaderData
} from '@remix-run/react';
import clsx from 'clsx';
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from 'remix-themes';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Toaster } from '~/components/ui/sonner';
import { themeSessionResolver } from '~/lib/sessions.server';
import { Header } from './components/header';
import { Button } from './components/ui/button';

// Return the theme from the session storage using the loader
export async function loader({ request }: LoaderFunctionArgs) {
	const { getTheme } = await themeSessionResolver(request);
	return {
		theme: getTheme()
	};
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>();
	return (
		<ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
			<App />
		</ThemeProvider>
	);
}

export function App() {
	const [theme] = useTheme();

	return (
		<html lang="en" className={clsx(theme)}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
				<Links />
			</head>
			<body className="min-h-screen h-screen">
				<Outlet />
				<Toaster />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const data = useRouteLoaderData<typeof loader>('root');

	return (
		<ThemeProvider specifiedTheme={data?.theme || null} themeAction="/action/set-theme">
			<ErrorBody />
		</ThemeProvider>
	);
}

function ErrorBody() {
	const error = useRouteError();
	const [theme] = useTheme();

	return (
		<html lang="en" className={clsx(theme)}>
			<head>
				<title>Insights - Error</title>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
				<Links />
			</head>
			<body className="min-h-screen h-screen">
				<div className="absolute w-full">
					<Header title="Error" />
				</div>
				<main className="flex justify-center items-center h-full">
					<Card className="sm:min-w-[500px]">
						{isRouteErrorResponse(error) ? (
							<CardHeader>
								<CardTitle>
									{error.status} {error.statusText}
								</CardTitle>
								<CardDescription>{error.data}</CardDescription>
							</CardHeader>
						) : error instanceof Error ? (
							<CardHeader>
								<CardTitle>Error</CardTitle>
								<CardDescription>{error.message}</CardDescription>
							</CardHeader>
						) : (
							<CardHeader>
								<CardTitle>Error</CardTitle>
								<CardDescription>An unknown error has occurred...</CardDescription>
							</CardHeader>
						)}
						<CardFooter className="gap-4">
							<Link to="/">
								<Button>Back to safety</Button>
							</Link>
							<Button variant="outline" onClick={() => window.location.reload()}>
								Reload
							</Button>
						</CardFooter>
					</Card>
				</main>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
