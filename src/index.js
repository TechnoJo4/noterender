import { html, render } from 'https://esm.run/lit-html';
import { unsafeHTML } from 'https://esm.run/lit-html/directives/unsafe-html.js';

import { createReplaceable, replaceable } from './replaceable.js';

import { marked } from './markup.js';

const NOTE_BASE = location.origin + "/notes/"; 
const SRC_BASE = location.origin + "/notes/src/";
const EDIT_BASE = location.origin + "/notes/edit.html#";
const HIST_BASE = location.origin + "/notes/git/?p=notes/.git;a=history;f=";

const content = createReplaceable(html``);
const links = createReplaceable(html``);

const cache = {};

const linkMap = fetch(SRC_BASE + "backlinks.json").then(r => r.json());

function getFile() {
	const parts = location.pathname.split("/");
	const last = parts[parts.length-1];
	const file = last === "" ? "index.md" : last+".md";
	return file;
}

const renderBacklink = (v) => html` <a href=${v}>${v}</a>`;

async function renderNote() {
	const file = getFile();

	const f = encodeURIComponent(file);
	if (!cache[file]) {
		const res = await fetch(SRC_BASE + file);
		if (!res.ok) {
			let createLink = html``;
			if (res.status === 404)
				createLink = html` (<a href=${EDIT_BASE + f}>create</a>)`;

			content.replace(html`<h1>Error</h1><p>${res.status}: ${res.statusText}${createLink}</p>`);
			return;
		}

		const markdown = await res.text();

		cache[file] = marked.parse(markdown);
	}

	content.replace(html`<div style="float: right;">
			<a href=${EDIT_BASE + f}>edit</a>
			<a href=${HIST_BASE + f}>history</a>
		</div>${unsafeHTML(cache[file])}`);

	const backlinks = (await linkMap)[file];
	if (file === getFile()) {
		links.replace(backlinks ? html`<hr>Notes linking here:${backlinks.map(renderBacklink)}` : html``);
	}
}

render(html`${replaceable(content)}${replaceable(links)}`, document.getElementById("maincontainer"));

document.addEventListener('click', e => {
	if (e?.target?.tagName === 'A' && e.target.href?.startsWith(NOTE_BASE) && !e.target.href?.match(/(?:[#?]|src\/)/)) {
		e.stopPropagation();
		e.preventDefault();
		history.pushState(null, "", e.target.href);
		renderNote();
		return false;
	}
});

window.addEventListener('popstate', () => {
	renderNote();
});

renderNote();
