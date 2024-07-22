import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
	// Enable debug in dev
	logLevel: 'info',
	plugins: [remix(), tsconfigPaths(), process.env.NODE_ENV === 'development' && mkcert()]
});
