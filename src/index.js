import { defineAddon, defineAddonOptions } from 'sv';
import { transforms } from './sv-utils.js';

const options = defineAddonOptions()
	.build();

export default defineAddon({
	id: '@datf/sveltekit-github-pages-config-dockerized',
	options,

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit');
	},

	run: ({ sv, file, language }) => {
		sv.file(
			'svelte.config.js',
			transforms.script(({ ast, js }) => {
				js.imports.addNamed(ast, {
					imports: ["vitePreprocess"],
					from: "@sveltejs/vite-plugin-svelte"
				});

				const { value: config } = js.exports.createDefault(ast);
				js.object.overrideProperties(config, {
					preprocess: js.functions.createCall({
						name: 'vitePreprocess',
						args: []
					}),
					compilerOptions: js.object.create({
						css: 'injected'
					}),
					output: js.object.create({
						bundleStrategy: 'inline'
					}),
					kit: js.object.create({
						adapter: js.common.parseExpression(`adapter({
								fallback: '404.html',
								pages: 'build',
								assets: 'build',
								precompress: false,
								strict: true
							})`)
					}),
					paths: js.object.create({
						base: js.common.parseExpression(`process.argv.includes('dev') ? '' : process.env.BASE_PATH`),
					}),
				});

			})
		);

		sv.file(
			file.viteConfig,
			transforms.script(({ ast, js }) => {
				const viteConfig = js.vite.getConfig(ast);
				js.object.overrideProperties(viteConfig, {
					server: js.object.create({ 
						host: '0.0.0.0',
						port: 5173,
						watch: {
							usePolling: true
						},
						hmr: {
							host: 'localhost',
							port: 5173
						}
					}),
					preview: js.object.create({ 
						host: '0.0.0.0',
						port: 4173
					})
				});
			})
		);
	}
});
