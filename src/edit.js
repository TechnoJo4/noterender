import { html, render } from 'https://esm.run/lit-html';
import { ref, createRef } from 'https://esm.run/lit-html/directives/ref.js';
import { unsafeHTML } from 'https://esm.run/lit-html/directives/unsafe-html.js';

import { createReplaceable, replaceable } from './replaceable.js';

import { marked } from './markup.js';

const SRC_BASE = location.origin + "/notes/src/";
const LINKS_NAME = "links.json";
const BACKLINKS_NAME = "backlinks.json";

const sourceRef = createRef();
const preview = createReplaceable(html``);

// link extractor
let linksInPage = [];
marked.use({
	walkTokens: function(token) {
		if (token.type === "link") {
			linksInPage.push(token.href);
		}
	}
});

const getAuth = () => localStorage.getItem("auth");

async function renderPreview() {
	const content = sourceRef.value.value;
	console.log(content);
	linksInPage = [];
	const rendered = marked.parse(content);
	console.log(rendered);
	preview.replace(unsafeHTML(rendered));
}

async function put(file, content, type) {
	return await fetch(SRC_BASE + file, {
		method: "PUT",
		credentials: "include",
		headers: {
			"Content-Type": type,
			"Authorization": getAuth()
		},
		body: content
	});
}

const filename = location.hash.replace(/^#/, "");
const linkMap = await fetch(SRC_BASE + LINKS_NAME).then(r => r.json());

async function save() {
	const pagename = filename.replace(/\.md$/, "");
	const content = sourceRef.value.value.replace(/\n*$/, "\n");

	renderPreview();

	// TODO: replaceable for progress?
	// upload page
	await put(filename, content, "text/plain");

	// generate link map
	linkMap[pagename] = linksInPage;
	await put(LINKS_NAME, JSON.stringify(linkMap), "application/json");

	// generate backlink map
	const backlinks = {};
	for (const entry of Object.entries(linkMap)) {
		const [page, links] = entry;

		for (const link of links) {
			if (link.indexOf("/") === -1) {
				const k = link + ".md";
				if (typeof backlinks[k] === "undefined")
					backlinks[k] = [];

				if (backlinks[k].indexOf(page) === -1)
					backlinks[k].push(page);
			}
		}
	}

	for (const k of Object.keys(backlinks)) {
		backlinks[k] = backlinks[k].sort();
	}

	await put(BACKLINKS_NAME, JSON.stringify(backlinks), "application/json");
}

const commitMsgRef = createRef();

async function commit() {
	await fetch("/notes/commit", {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "text/plain",
			"Authorization": getAuth()
		},
		body: commitMsgRef.value.value
	});
}

const authInputRef = createRef();

function setAuth() {
	localStorage.setItem("auth", "Basic " + btoa(authInputRef.value.value));
}

render(html`<textarea ${ref(sourceRef)}></textarea>
	<div class="rowOrCol">
		<div class="row" style="flex:1">
			<button @click=${() => renderPreview()}>Preview</button>
			<button @click=${() => save()}>Save</button>
			</div>
		<div class="row" style="flex:1">
			<input ${ref(commitMsgRef)} type="text"></input>
			<button @click=${() => commit()}>Commit</button>
		</div>
		<div class="row" style="flex:1">
			<input ${ref(authInputRef)} type="text"></input>
			<button @click=${() => setAuth()}>Set Auth</button>
		</div>
	</div>
	<div>${replaceable(preview)}</div>`, document.getElementById("editorcontainer"));

(async () => {
	const res = await fetch(SRC_BASE + filename);
	sourceRef.value.value = res.ok ? await res.text() : "";
	commitMsgRef.value.value = (res.ok ? "Edit " : "Create ") + filename;

	renderPreview();
})();

addEventListener("hashchange", () => {
	location.reload();
});
