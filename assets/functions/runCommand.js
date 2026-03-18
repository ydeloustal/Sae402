import { state } from "./state.js";
import { normalizeCommand } from "./normalizeCommand.js";
import { printCommandEcho } from "./printCommandEcho.js";
import { printLine } from "./printLine.js";
import { printNext } from "./printNext.js";
import { logExecutedCommand } from "./logExecutedCommand.js";

const KNOWN_COMMANDS = new Set(["next", "help", "ping"]);

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
		return;
	}

	if (command === "ping") {
		printLine("pong", "character", true);
		return;
	}

	printLine(`Commande inconnue: ${command}`, "system", true);
	printLine("Tape 'help' pour voir les commandes.", "system", true);
}