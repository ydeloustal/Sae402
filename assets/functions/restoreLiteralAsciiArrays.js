import { extractAsciiArraysFromSource } from "./extractAsciiArraysFromSource.js";

export function restoreLiteralAsciiArrays(story, source) {
	const asciiArrays = extractAsciiArraysFromSource(source);
	let asciiIndex = 0;

	for (const panel of story.panels || []) {
		if (!Array.isArray(panel.ascii)) {
			continue;
		}

		const literalAscii = asciiArrays[asciiIndex];
		if (Array.isArray(literalAscii)) {
			panel.ascii = literalAscii;
		}
		asciiIndex += 1;
	}
}