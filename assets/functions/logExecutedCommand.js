import { state } from "./state.js";

const MAX_LOGGED_COMMANDS = 20;

function renderCommandLogs() {
	const logsList = document.querySelector(".aside-log ul");
	if (!logsList) return;

	logsList.textContent = "";

	if (state.commandLogs.length === 0) {
		const empty = document.createElement("li");
		empty.className = "log-empty";
		empty.textContent = "Aucune commande executee.";
		logsList.append(empty);
		return;
	}

	const fragment = document.createDocumentFragment();
	for (const command of state.commandLogs) {
		const item = document.createElement("li");
		item.className = "log-command";
		item.textContent = command;
		fragment.append(item);
	}

	logsList.append(fragment);
}

export function initCommandLogs() {
	renderCommandLogs();
}

export function logExecutedCommand(command, options = {}) {
	const normalized = String(command || "").trim();
	if (!normalized) return;

	const isKnown = options.isKnown === true;
	const typedValue = String(options.typedValue || normalized).trim();
	const entry = isKnown
		? `exec command -${normalized}`
		: `had typed -(${typedValue || normalized})`;

	state.commandLogs.unshift(entry);
	if (state.commandLogs.length > MAX_LOGGED_COMMANDS) {
		state.commandLogs.length = MAX_LOGGED_COMMANDS;
	}

	renderCommandLogs();
}