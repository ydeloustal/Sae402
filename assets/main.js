import { state, commandInput } from "./functions/state.js";
import { printLine, setPrintNext } from "./functions/printLine.js";
import { runCommand } from "./functions/runCommand.js";
import { loadStory } from "./functions/loadStory.js";
import { printNext } from "./functions/printNext.js";
import { keepTerminalInputFocused } from "./functions/keepTerminalInputFocused.js";

setPrintNext(printNext);

const KNOWN_COMMANDS = [
	"next",
	"help",
	"hint",
	"ping",
	"back",
	"a",
	"b",
	"c",
	"zonea",
	"zoneb",
	"zonec",
	"hint",
];


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
const promptSpan = document.querySelector("#inputLine .invite_terminal");
if (promptSpan) promptSpan.textContent = `${state.currentPath}>`;
keepTerminalInputFocused(commandInput);