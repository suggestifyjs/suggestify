import path from 'path';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

module.exports = {
	build: {
		target: 'esnext',
		emptyOutDir: false,
		lib: {
			entry: path.resolve(__dirname, 'src/suggestify.ts'),
			formats: ['esm', 'umd'],
			name: 'suggestify',
		},
		outDir: './lib',
		rollupOptions: {
			plugins: [
				copy({
					targets: [
						{
							src: 'src/style.scss',
							dest: 'lib',
						},
					],
					hook: 'writeBundle',
				}),
			],
			output: {
				banner: `/*!
* ${pkg.name} v${pkg.version}
* (c) 2021 ${pkg.author}
* @license MIT
*/`,
			},
		},
	},
};
