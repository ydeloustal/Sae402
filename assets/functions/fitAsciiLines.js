import { normalizeAsciiGlyphs } from "./normalizeAsciiGlyphs.js";

export function fitAsciiLines(lines, fallbackWidth) {
	const cleanLines = lines.map((line) => normalizeAsciiGlyphs(line));
	const widest = cleanLines.reduce((max, line) => Math.max(max, line.length), 0);
	const targetWidth = Math.max(Number(fallbackWidth) || 0, widest);

	return cleanLines.map((line) => {
		if (line.length > targetWidth) {
			return line.slice(0, targetWidth);
		}
		return line.padEnd(targetWidth, " ");
	});
}