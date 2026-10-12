// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import { remarkSentenceSpans } from './src/lib/remark-sentence-spans';

export default defineConfig({
  integrations: [
    react(),
    mdx(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkSentenceSpans],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://aayushnaik.com',
});
