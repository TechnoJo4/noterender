import { marked } from 'https://esm.run/marked';
import { markedSmartypants } from 'https://esm.run/marked-smartypants';
import markedKatex from 'https://esm.run/marked-katex-extension';

marked.use(markedSmartypants());
marked.use(markedKatex({ throwOnError: false }));

// Allow links to other [[Articles]] within the same notes-wiki-thing
const tokenizer = {
	link(src) {
		const match = src.match(/^\[\[([^\]\n]+?)\]\]/);
		if (match) {
			const text = match[1].trim();
			return {
				type: 'link',
				raw: match[0],
				text,
				title: null,
				href: text.replace(" ", "_").toLowerCase(),
				tokens: [ {
					type: 'text',
					raw: text,
					text: text
				} ]
			};
		}

		return false;
	}
};

marked.use({ tokenizer });

export { marked };
