import { state, commandInput } from "./state.js";
import { scrollTerminal } from "./scrollTerminal.js";

const INLINE_MARKER_PATTERN = /\{\{\s*(dots(?::\s*([^}]+))?|br|nl|newline|next)\s*\}\}/gi;
const DEFAULT_WAIT_MS = 1200;
const MIN_WAIT_MS = 100;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseWaitDuration(rawValue) {
	if (Number.isFinite(rawValue)) {
		return Math.max(MIN_WAIT_MS, Math.floor(rawValue));
	}

	const raw = String(rawValue || "").trim().toLowerCase();
	if (!raw) {
		return DEFAULT_WAIT_MS;
	}

	if (raw.endsWith("ms")) {
		const value = Number.parseFloat(raw.slice(0, -2));
		if (Number.isFinite(value)) {
			return Math.max(MIN_WAIT_MS, Math.floor(value));
		}
	}

	if (raw.endsWith("s")) {
		const value = Number.parseFloat(raw.slice(0, -1));
		if (Number.isFinite(value)) {
			return Math.max(MIN_WAIT_MS, Math.floor(value * 1000));
		}
	}

	const numeric = Number.parseFloat(raw);
	if (Number.isFinite(numeric)) {
		return Math.max(MIN_WAIT_MS, Math.floor(numeric));
	}

	return DEFAULT_WAIT_MS;
}

function splitInlineTokens(text) {
	const parts = [];
	let cursor = 0;
	let match = INLINE_MARKER_PATTERN.exec(text);

	while (match) {
		if (match.index > cursor) {
			parts.push({ type: "text", value: text.slice(cursor, match.index) });
		}

		const marker = String(match[1] || "").trim().toLowerCase();
		if (marker.startsWith("dots")) {
			parts.push({
				type: "dots",
				durationMs: parseWaitDuration(match[2]),
			});
		} else if (marker === "next") {
			parts.push({ type: "next" });
		} else {
			parts.push({ type: "lineBreak" });
		}

		cursor = match.index + match[0].length;
		match = INLINE_MARKER_PATTERN.exec(text);
	}

	if (cursor < text.length) {
		parts.push({ type: "text", value: text.slice(cursor) });
	}

	if (parts.length === 0) {
		parts.push({ type: "text", value: text });
	}

	INLINE_MARKER_PATTERN.lastIndex = 0;
	return parts;
}

async function typeChunk(node, text, charsPerTick, intervalMs) {
	if (!text) return;

	const textNode = document.createTextNode("");
	node.append(textNode);

	let i = 0;
	while (i < text.length) {
		textNode.textContent += text.slice(i, i + charsPerTick);
		i += charsPerTick;
		scrollTerminal();
		if (i < text.length) {
			await sleep(intervalMs);
		}
	}
}

async function showInlineDots(node, durationMs) {
	const dots = document.createElement("span");
	dots.className = "wait-dots wait-dots-inline";

	for (let i = 0; i < 3; i += 1) {
		const dot = document.createElement("span");
		dot.className = "wait-dot";
		dot.textContent = ".";
		dot.style.animationDelay = `${i * 0.12}s`;
		dots.append(dot);
	}

	node.append(dots);
	scrollTerminal();
	await sleep(durationMs);

	dots.replaceWith(document.createTextNode(" ✓"));
	scrollTerminal();
}

function insertInlineLineBreak(node) {
	node.append(document.createTextNode("\n"));
	scrollTerminal();
}

export async function typeWrite(node, text, typing = {}) {
	const intervalMs = Number.isFinite(typing.intervalMs) ? Math.max(1, typing.intervalMs) : 16;
	const charsPerTick = Number.isFinite(typing.charsPerTick) ? Math.max(1, Math.floor(typing.charsPerTick)) : 1;
	const onNext = typing.onNext || null;

	state.isTyping = true;
	commandInput.disabled = true;

	try {
		const chunks = splitInlineTokens(text);
		for (const chunk of chunks) {
			if (chunk.type === "dots") {
				await showInlineDots(node, chunk.durationMs);
			} else if (chunk.type === "lineBreak") {
				insertInlineLineBreak(node);
			} else if (chunk.type === "next") {
				state.isTyping = false;
				if (typing.onNext) await typing.onNext();
				state.isTyping = true;
			} else {
				await typeChunk(node, chunk.value, charsPerTick, intervalMs);
			}
		}
	} finally {
		state.isTyping = false;
		commandInput.disabled = false;
		commandInput.focus();
	}
}