import { terminalBody } from "./state.js";

export function scrollTerminal() {
	terminalBody.scrollTop = terminalBody.scrollHeight;
}