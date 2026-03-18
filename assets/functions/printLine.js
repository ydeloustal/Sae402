import { state, classeParType, terminalBody, inputLine, shellPath } from "./state.js";
import { getTimestamp } from "./getTimestamp.js";
import { typeWrite } from "./typeWrite.js";
import { scrollTerminal } from "./scrollTerminal.js";

export function printLine(text, type = "character", instant = false, options = { mode: "log" }) {
	const line = document.createElement("p");
	line.className = `ligne ${classeParType[type] || "ligne_perso"}`;
	if (options.extraClass) {
		line.classList.add(options.extraClass);
	}

	const mode = options.mode || "log";
	const content = document.createElement("span");
	let textToPrint = text;

	if (mode === "log") {
		const timestamp = document.createElement("span");
		timestamp.className = "horodatage";
		timestamp.textContent = getTimestamp();

		const tag = document.createElement("span");
		tag.className = "etiquette";
		tag.textContent = type === "system" ? "[INFO]" : "[STORY]";

		line.append(timestamp, tag, content);
	} else if (mode === "plain") {
		line.append(content);
	} else {
		const timestamp = document.createElement("span");
		timestamp.className = "horodatage";
		timestamp.textContent = getTimestamp();

		const prompt = document.createElement("span");
		prompt.className = "invite_terminal";
		prompt.textContent = `PS ${shellPath}>`;
		line.append(prompt, content);
		textToPrint = text.replace(`PS ${shellPath}> `, "");
	}

	terminalBody.insertBefore(line, inputLine);

	if (instant) {
		content.textContent = mode === "log" || mode === "plain" ? textToPrint : ` ${textToPrint}`;
		scrollTerminal();
		return Promise.resolve();
	}

	const prefix = mode === "log" || mode === "plain" ? "" : " ";
	const typing = options.typing || {};
	return typeWrite(content, `${prefix}${textToPrint}`, typing);
}