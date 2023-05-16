import { EmailSignIn } from '@/components/email-sign-in';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/server/auth';
import {
	type GetServerSidePropsContext,
	type InferGetServerSidePropsType,
} from 'next';
import { getServerSession } from 'next-auth';
import { getProviders, signIn } from 'next-auth/react';
import Head from 'next/head';

export default function SignIn({
	providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<>
			<Head>
				<title>Home</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center gap-12 px-4 py-16 md:w-[356px]">
					<div className="flex flex-col gap-2 text-center">
						<h1 className="text-2xl font-bold tracking-tight">
							Sign-in to NTP account
						</h1>
						<p className="text-sm text-muted-foreground">
							Select sign-in provider.
						</p>
					</div>
					<EmailSignIn />
					<div className="relative w-full">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t"></span>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>
					<div className="flex w-full flex-col gap-2">
						{Object.values(providers).map((provider) => {
							// Hide email and credentials sign-in
							if (provider.id === 'email' || provider.id === 'credentials')
								return null;

							return (
								<div key={provider.name}>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										onClick={() => void signIn(provider.id)}
									>
										Sign-in with {provider.name}
									</Button>
								</div>
							);
						})}
					</div>
				</div>
			</main>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, authOptions);

	if (session) {
		return { redirect: { destination: '/' } };
	}

	const providers = await getProviders();

	return {
		props: { providers: providers ?? [] },
	};
}
