import { state, commandInput, terminalBody, inputLine } from "./state.js";
import { scrollTerminal } from "./scrollTerminal.js";

const DEFAULT_WAIT_MS = 1500;
const MIN_WAIT_MS = 100;

function parseWaitDuration(entry = {}) {
	if (Number.isFinite(entry.durationMs)) {
		return Math.max(MIN_WAIT_MS, Math.floor(entry.durationMs));
	}

	if (Number.isFinite(entry.duration)) {
		return Math.max(MIN_WAIT_MS, Math.floor(entry.duration));
	}

	if (typeof entry.duration === "string") {
		const normalized = entry.duration.trim().toLowerCase();
		if (normalized.endsWith("ms")) {
			const value = Number.parseFloat(normalized.slice(0, -2));
			if (Number.isFinite(value)) {
				return Math.max(MIN_WAIT_MS, Math.floor(value));
			}
		}
		if (normalized.endsWith("s")) {
			const value = Number.parseFloat(normalized.slice(0, -1));
			if (Number.isFinite(value)) {
				return Math.max(MIN_WAIT_MS, Math.floor(value * 1000));
			}
		}
	}

	return DEFAULT_WAIT_MS;
}

export function printWait(entry = {}) {
	const line = document.createElement("p");
	line.className = "ligne ligne_systeme ligne_wait";

	const dots = document.createElement("span");
	dots.className = "wait-dots";

	for (let i = 0; i < 3; i += 1) {
		const dot = document.createElement("span");
		dot.className = "wait-dot";
		dot.textContent = ".";
		dot.style.animationDelay = `${i * 0.18}s`;
		dots.append(dot);
	}

	line.append(dots);
	terminalBody.insertBefore(line, inputLine);
	scrollTerminal();

	const waitMs = parseWaitDuration(entry);
	state.isTyping = true;
	commandInput.disabled = true;

	return new Promise((resolve) => {
		setTimeout(() => {
			line.remove();
			state.isTyping = false;
			commandInput.disabled = false;
			commandInput.focus();
			resolve();
		}, waitMs);
	});
}