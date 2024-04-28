import { env } from '~/env.server';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_KEY);

export async function sendCode(body: { to: string; code: string, magicLink: string }) {
	await resend.emails.send({
		from: `NTP Insights <${env.RESEND_EMAIL}>`,
		to: body.to,
		subject: 'Your verification code',
		html: `
			<div>
				<h1>Your verification code</h1>
				<p>Your verification code is: <strong>${body.code}</strong></p>
				<p>Click the link below to verify your account:</p>
				<p><a href="${body.magicLink}">Verify</a></p>
			</div>
		`
	});
}
