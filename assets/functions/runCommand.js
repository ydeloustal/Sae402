import { state } from "./state.js";
import { normalizeCommand } from "./normalizeCommand.js";
import { printCommandEcho } from "./printCommandEcho.js";
import { printLine } from "./printLine.js";
import { printNext } from "./printNext.js";
import { logExecutedCommand } from "./logExecutedCommand.js";

const KNOWN_COMMANDS = new Set([
	"next",
	"help",
	"ping",
	"a",
	"b",
	"c",
	"zonea",
	"zoneb",
	"zonec",
	"zone a",
	"zone b",
	"zone c",
	"hint",
]);

function resolveZoneKey(command) {
	if (command === "a" || command === "zonea" || command === "zone a") return "a";
	if (command === "b" || command === "zoneb" || command === "zone b") return "b";
	if (command === "c" || command === "zonec" || command === "zone c") return "c";
	return null;
}

export async function runCommand(rawCommand) {
	const command = normalizeCommand(rawCommand);

	if (!command) {
		return;
	}

	printCommandEcho(command);
	logExecutedCommand(command, {
		isKnown: KNOWN_COMMANDS.has(command),
		typedValue: rawCommand,
	});

	if (state.awaitingZoneChoice) {
		const zoneKey = resolveZoneKey(command);
		const zoneEntries = zoneKey ? state.zones[zoneKey] : null;

		if (!zoneKey || !Array.isArray(zoneEntries) || zoneEntries.length === 0) {
			printLine("Choix invalide. Tape A, B ou C.", "system", true);
			return;
		}

		state.awaitingZoneChoice = false;
		state.queue = [...zoneEntries];
		state.pointer = 0;
		state.hasPrintedEnd = false;
		state.isStoryEnded = false;
		state.hasPromptedZoneChoice = true;

		printLine(`Acces a la zone ${zoneKey.toUpperCase()}...`, "system", true);
		await printNext();
		return;
	}

	if (command === "next") {
		if (state.isStoryEnded) {
			printLine("Le recit est termine. Modifie story.json pour continuer.", "system", true);
			return;
		}

		await printNext();
		return;
	}

	if (command === "help") {
		printLine("Commandes disponibles:", "system", true);
		printLine("- next : affiche la ligne suivante du recit", "system", true);
		printLine("- help : affiche cette aide", "system", true);
		printLine("- A/B/C : choisit une zone quand le choix est demande", "system", true);
		return;
	}

	if (command === "ping") {
		printLine("pong", "character", true);
		return;
	}

	printLine(`Commande inconnue: ${command}`, "system", true);
	printLine("Tape 'help' pour voir les commandes.", "system", true);
}