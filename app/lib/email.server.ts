import { Resend } from 'resend';
import { env } from '~/env.server';

const resend = new Resend(env.RESEND_KEY);

export async function sendCode(body: { to: string; code: string; magicLink: string }) {
	await resend.emails.send({
		from: `CSSL Insights <${env.RESEND_EMAIL}>`,
		to: body.to,
		subject: 'Your verification code',
		html: `
			<div>
				<h1>Your verification code</h1>
				<p>Your verification code is: <strong>${body.code}</strong></p>
				<p>Click the link below to verify your account:</p>
				<a href="${body.magicLink}">Verify</a>
			</div>
		`
	});
}

export async function sendInviteNotification(body: { to: string }) {
	await resend.emails.send({
		from: `CSSL Insights <${env.RESEND_EMAIL}>`,
		to: body.to,
		subject: 'You have been invited to CSSL Insights',
		html: `
			<div>
				<h1>You have been invited to CSSL Insights</h1>
				<p>Click the link below to create your account:</p>
				<a href="${env.BASE_URL}/auth/login">Login</a>
			</div>
		`
	});
}
