import { state, commandInput } from "./functions/state.js";
import { isHexDigit } from "./functions/isHexDigit.js";
import { isValidJsonEscape } from "./functions/isValidJsonEscape.js";
import { sanitizeJsonBackslashes } from "./functions/sanitizeJsonBackslashes.js";
import { preserveEscapedForwardSlash } from "./functions/preserveEscapedForwardSlash.js";
import { parseStoryJsonWithTolerance } from "./functions/parseStoryJsonWithTolerance.js";
import { skipWhitespace } from "./functions/skipWhitespace.js";
import { decodeLiteralAsciiString } from "./functions/decodeLiteralAsciiString.js";
import { readLiteralJsonString } from "./functions/readLiteralJsonString.js";
import { extractAsciiArraysFromSource } from "./functions/extractAsciiArraysFromSource.js";
import { restoreLiteralAsciiArrays } from "./functions/restoreLiteralAsciiArrays.js";
import { loadStory } from "./functions/loadStory.js";
import { formatLine } from "./functions/formatLine.js";
import { getTimestamp } from "./functions/getTimestamp.js";
import { printLine } from "./functions/printLine.js";
import { typeWrite } from "./functions/typeWrite.js";
import { normalizeAsciiLines } from "./functions/normalizeAsciiLines.js";
import { normalizeAsciiGlyphs } from "./functions/normalizeAsciiGlyphs.js";
import { fitAsciiLines } from "./functions/fitAsciiLines.js";
import { buildAsciiPreset } from "./functions/buildAsciiPreset.js";
import { resolveAsciiEntry } from "./functions/resolveAsciiEntry.js";
import { printAscii } from "./functions/printAscii.js";
import { scrollTerminal } from "./functions/scrollTerminal.js";
import { printNext } from "./functions/printNext.js";
import { printCommandEcho } from "./functions/printCommandEcho.js";
import { normalizeCommand } from "./functions/normalizeCommand.js";
import { runCommand } from "./functions/runCommand.js";
import { initLogsAutoScroll } from "./functions/initLogsAutoScroll.js";
import { keepTerminalInputFocused } from "./functions/keepTerminalInputFocused.js";

const KNOWN_COMMANDS = ["next", "help","ping"];


commandInput.addEventListener("keydown", async (event) => {
	// ── Flèche haut : commande précédente ──────────────────────────
	if (event.key === "ArrowUp") {
		event.preventDefault();
		if (state.history.length === 0) return;
		state.historyPointer = Math.min(
			state.historyPointer + 1,
			state.history.length - 1
		);
		commandInput.value = state.history[state.historyPointer];
		// place le curseur en fin de texte
		requestAnimationFrame(() => {
			commandInput.selectionStart = commandInput.selectionEnd = commandInput.value.length;
		});
		return;
	}

	// ── Flèche bas : commande suivante ────────────────────────────
	if (event.key === "ArrowDown") {
		event.preventDefault();
		if (state.historyPointer <= 0) {
			state.historyPointer = -1;
			commandInput.value = "";
			return;
		}
		state.historyPointer -= 1;
		commandInput.value = state.history[state.historyPointer];
		requestAnimationFrame(() => {
			commandInput.selectionStart = commandInput.selectionEnd = commandInput.value.length;
		});
		return;
	}

	// ── Tab : autocomplétion ──────────────────────────────────────
	if (event.key === "Tab") {
		event.preventDefault();
		const partial = commandInput.value.trim().toLowerCase();
		if (!partial) return;
		const matches = KNOWN_COMMANDS.filter((cmd) => cmd.startsWith(partial));
		if (matches.length === 1) {
			// complétion unique → on remplace
			commandInput.value = matches[0];
		} else if (matches.length > 1) {
			// plusieurs possibilités → on les affiche
			printLine(`Complétion : ${matches.join("  ")}`, "system", true);
		}
		return;
	}

	// ── Entrée : exécution ────────────────────────────────────────
	if (event.key === "Enter") {
		event.preventDefault();
		if (state.isTyping) return;

		const raw = commandInput.value;
		commandInput.value = "";

		// ajout à l'historique (sans doublon consécutif)
		const normalized = raw.trim();
		if (normalized && state.history[0] !== normalized) {
			state.history.unshift(normalized);
		}
		state.historyPointer = -1;

		await runCommand(raw);
	}
});

commandInput.addEventListener("input", () => {
	if (!state.hasTypedOnce && commandInput.value.length > 0) {
		state.hasTypedOnce = true;
		commandInput.removeAttribute("placeholder");
	}
});

loadStory();
initLogsAutoScroll();
keepTerminalInputFocused(commandInput);