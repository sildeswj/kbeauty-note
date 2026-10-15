// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeEditorial from './src/lib/rehype-editorial.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://kbeauty.jworld.dev',
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [rehypeEditorial],
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Plus Jakarta Sans',
			cssVariable: '--font-sans',
			weights: [400, 500, 700],
			styles: ['normal'],
			subsets: ['latin', 'latin-ext'],
			fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Lora',
			cssVariable: '--font-serif',
			weights: [500, 600, 700],
			styles: ['normal'],
			subsets: ['latin', 'latin-ext'],
			fallbacks: ['Georgia', 'serif'],
		},
	],
});
