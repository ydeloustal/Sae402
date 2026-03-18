import { resolveAsciiEntry } from "./resolveAsciiEntry.js";
import { printLine } from "./printLine.js";

export async function printAscii(entry) {
	const { lines, width, label } = resolveAsciiEntry(entry);
	await printLine(`${label}`, "system", true, { mode: "log" });
	await printLine(lines.join("\n"), "character", false, {
		mode: "plain",
		extraClass: "ligne_ascii",
		typing: {
			intervalMs: 1,
			charsPerTick: 10,
		},
	});
}