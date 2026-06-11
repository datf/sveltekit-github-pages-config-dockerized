import { defineAddon, defineAddonOptions } from 'sv';
import { transforms, svelteConfig } from './sv-utils.js';

const options = defineAddonOptions()
	.build();

export default defineAddon({
	id: '@datf/sveltekit-github-pages-config-dockerized',
	options,

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit');
	},

	run: ({ sv, file, language, cwd }) => {
		svelteConfig.edit({ sv, cwd }, ({ ast, override, js }) => {
			const { value: config } = js.exports.createDefault(ast);
			override({
				compilerOptions: js.object.create({
					css: 'injected'
				}),
				kit: js.object.create({
					output: js.object.create({
						bundleStrategy: 'inline'
					}),
					paths: js.object.create({
						base: js.common.parseExpression(`process.argv.includes('dev') ? '' : process.env.BASE_PATH`),
					}),
					adapter: js.common.parseExpression(`adapter({
							fallback: '404.html',
							pages: 'build',
							assets: 'build',
							precompress: false,
							strict: true
						})`)
				}),
			});
		});

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
