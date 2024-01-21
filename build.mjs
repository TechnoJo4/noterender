import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import * as esbuild from 'esbuild';

const litHtmlTrimLeadingWhitespace = {
	name: 'lit-html-trim-leading-whitespace',
	setup(build) {
		build.onLoad({ filter: /.*\.js/ }, async ({ path }) => {
			return {
				contents: (await fs.readFile(path, "utf8"))
					.replaceAll(/html`[\s\S]+?`/g, match => {
						return match.replaceAll(/^[ \t]*/gm, "");
					})
			};
		})
	}
};

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist');
await fs.cp('src/style.css', 'dist/style.css');

const apps = ['index', 'edit'];

for (const app of apps) {
	console.log(app);

	await fs.cp('src/'+app+'.html', 'dist/'+app+'.html');

	console.log(await esbuild.build({
		entryPoints: [ 'src/'+app+'.js' ],
		outfile: 'dist/'+app+'.js',
		platform: 'browser',
		format: 'esm',
		bundle: true,
		minify: false,
		plugins: [ litHtmlTrimLeadingWhitespace ],
	}));
}
