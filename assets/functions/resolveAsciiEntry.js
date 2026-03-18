import { state } from "./state.js";
import { normalizeAsciiLines } from "./normalizeAsciiLines.js";
import { fitAsciiLines } from "./fitAsciiLines.js";
import { buildAsciiPreset } from "./buildAsciiPreset.js";

export function resolveAsciiEntry(entry) {
    const requested = Number(entry.preset || entry.width || 71);
    const presetWidth = state.asciiWidths.includes(requested) ? requested : 71;
    const rawLines = normalizeAsciiLines(entry.ascii)
        || buildAsciiPreset(presetWidth, state.asciiDefaultHeight, entry.label);
    const lines = fitAsciiLines(rawLines, presetWidth);

    return {
        lines,
        width: presetWidth,
        label: entry.label || `ASCII ${presetWidth}`,
    };
}