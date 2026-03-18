import { state, commandInput } from "./state.js";
import { scrollTerminal } from "./scrollTerminal.js";

export function typeWrite(node, text, typing = {}) {
	const intervalMs = Number.isFinite(typing.intervalMs) ? Math.max(1, typing.intervalMs) : 16;
	const charsPerTick = Number.isFinite(typing.charsPerTick) ? Math.max(1, Math.floor(typing.charsPerTick)) : 1;

	state.isTyping = true;
	commandInput.disabled = true;

	return new Promise((resolve) => {
		let i = 0;
		const timer = setInterval(() => {
			node.textContent += text.slice(i, i + charsPerTick);
			i += charsPerTick;
			scrollTerminal();

			if (i >= text.length) {
				clearInterval(timer);
				state.isTyping = false;
				commandInput.disabled = false;
				commandInput.focus();
				resolve();
			}
		}, intervalMs);
	});
}