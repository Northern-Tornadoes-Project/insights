import '~/tailwind.css';

import clsx from 'clsx';
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useRouteError,
	isRouteErrorResponse,
	Link,
	useRouteLoaderData
} from '@remix-run/react';
import { themeSessionResolver } from '~/lib/sessions.server';
import { Toaster } from '~/components/ui/sonner';
import { LoaderFunctionArgs } from '@remix-run/node';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '~/components/ui/card';
import { PreventFlashOnWrongTheme, Theme, ThemeProvider, useTheme } from 'remix-themes';
import { Header } from './components/header';
import { Button } from './components/ui/button';
import { useEffect, useState } from 'react';

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
							<Link to="/auth/login">
								<Button variant="outline">Login</Button>
							</Link>
						</CardFooter>
					</Card>
				</main>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
