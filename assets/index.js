const terminalBody = document.getElementById("terminalBody");
const commandInput = document.getElementById("commandInput");
const inputLine = document.getElementById("inputLine");

const state = {
	queue: [],
	pointer: 0,
	isTyping: false,
	hasPrintedEnd: false,
	isStoryEnded: false,
	hasTypedOnce: false,
	asciiWidths: [40, 50, 70, 80, 100],
	asciiDefaultHeight: 12,
};

const shellPath = "C:\\Users\\???\\???";
const classeParType = {
	system: "ligne_systeme",
	narrator: "ligne_narrateur",
	character: "ligne_perso",
};

async function loadStory() {
	try {
		const [storyResponse, presetsResponse] = await Promise.all([
			fetch("assets/story.json"),
			fetch("assets/ascii-presets.json"),
		]);

		if (!storyResponse.ok) {
			throw new Error(`HTTP ${storyResponse.status} sur story.json`);
		}

		if (presetsResponse.ok) {
			const presets = await presetsResponse.json();
			if (Array.isArray(presets.presetWidths) && presets.presetWidths.length > 0) {
				state.asciiWidths = presets.presetWidths.map(Number).filter(Number.isFinite);
			}
			if (Number.isFinite(presets.defaultHeight)) {
				state.asciiDefaultHeight = Math.max(6, Math.floor(presets.defaultHeight));
			}
		}

		const story = await storyResponse.json();
		const intro = Array.isArray(story.intro) ? story.intro : [];
		const panels = Array.isArray(story.panels) ? story.panels : [];

		state.queue = [...intro, ...panels];
		printLine(`Session ouverte: ${story.title || "Recit sans titre"}`, "system", true);
		printLine(`Fragments disponibles: ${panels.length}`, "system", true);
		printLine(`Presets ASCII: ${state.asciiWidths.join(", ")} colonnes`, "system", true);
		printLine("Commandes: next, help", "system", true);
		printLine("Tape 'next' puis Entree pour avancer.", "system", true);
	} catch (error) {
		printLine("Erreur de chargement du récit JSON.", "system", true);
		printLine(String(error), "system", true);
		commandInput.disabled = true;
	}
}

function formatLine(entry) {
	if (entry.speaker) {
		return `${entry.speaker}: ${entry.text}`;
	}

	return entry.text || "";
}

function getTimestamp() {
	const now = new Date();
	const date = now.toLocaleDateString("fr-FR");
	const time = now.toLocaleTimeString("fr-FR", { hour12: false });
	return `${date} ${time}`;
}

function printLine(text, type = "character", instant = false, options = { mode: "log" }) {
	const line = document.createElement("p");
	line.className = `ligne ${classeParType[type] || "ligne_perso"}`;

	const mode = options.mode || "log";
	const content = document.createElement("span");
	let textToPrint = text;

	if (mode === "log") {
		const timestamp = document.createElement("span");
		timestamp.className = "horodatage";
		timestamp.textContent = getTimestamp();

		const tag = document.createElement("span");
		tag.className = "etiquette";
		tag.textContent = type === "system" ? "[INFO ]" : "[STORY]";

		line.append(timestamp, tag, content);
	} else {
		const prompt = document.createElement("span");
		prompt.className = "invite_terminal";
		prompt.textContent = `PS ${shellPath}>`;
		line.append(prompt, content);
		textToPrint = text.replace(`PS ${shellPath}> `, "");
	}

	terminalBody.insertBefore(line, inputLine);

	if (instant) {
		content.textContent = mode === "log" ? textToPrint : ` ${textToPrint}`;
		scrollTerminal();
		return Promise.resolve();
	}

	const prefix = mode === "log" ? "" : " ";
	const typing = options.typing || {};
	return typeWrite(content, `${prefix}${textToPrint}`, typing);
}

function typeWrite(node, text, typing = {}) {
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

function normalizeAsciiLines(value) {
	if (Array.isArray(value)) {
		return value.map((line) => String(line));
	}

	if (typeof value === "string") {
		return value.split("\n");
	}

	return null;
}

function buildAsciiPreset(width, height, label) {
	const safeWidth = Math.max(12, Math.floor(width));
	const safeHeight = Math.max(6, Math.floor(height));
	const horizontal = "-".repeat(safeWidth - 2);
	const top = `+${horizontal}+`;
	const middle = [];
	const centerRow = Math.floor((safeHeight - 2) / 2);
	const text = (label || `ASCII PRESET ${safeWidth}`).toUpperCase();

	for (let i = 0; i < safeHeight - 2; i += 1) {
		if (i === centerRow) {
			const maxTextLength = Math.max(0, safeWidth - 4);
			const trimmed = text.slice(0, maxTextLength);
			const leftPad = Math.floor((safeWidth - 2 - trimmed.length) / 2);
			const rightPad = safeWidth - 2 - trimmed.length - leftPad;
			middle.push(`|${" ".repeat(leftPad)}${trimmed}${" ".repeat(rightPad)}|`);
		} else {
			middle.push(`|${" ".repeat(safeWidth - 2)}|`);
		}
	}

	return [top, ...middle, top];
}

function resolveAsciiEntry(entry) {
	const requested = Number(entry.preset || entry.width || 70);
	const presetWidth = state.asciiWidths.includes(requested) ? requested : 70;
	const lines = normalizeAsciiLines(entry.ascii)
		|| buildAsciiPreset(presetWidth, state.asciiDefaultHeight, entry.label);

	return {
		lines,
		width: presetWidth,
		label: entry.label || `ASCII ${presetWidth}`,
	};
}

async function printAscii(entry) {
	const { lines, width, label } = resolveAsciiEntry(entry);
	await printLine(`[ASCII] ${label} (${width} colonnes)`, "system", true, { mode: "log" });
	await printLine(lines.join("\n"), "character", false, {
		mode: "prompt",
		typing: {
			intervalMs: 1,
			charsPerTick: 5,
		},
	});
}

function scrollTerminal() {
	terminalBody.scrollTop = terminalBody.scrollHeight;
}

async function printNext() {
	if (state.isTyping) {
		return;
	}

	if (state.pointer >= state.queue.length) {
		if (!state.hasPrintedEnd) {
			printLine("Fin de transmission.", "system", true);
			state.hasPrintedEnd = true;
			state.isStoryEnded = true;
		}
		return;
	}

	const entry = state.queue[state.pointer];
	state.pointer += 1;

	if (entry.type === "ascii") {
		const width = Number(entry.preset || entry.width || 70);
		printLine(`Show-AsciiArt -Width ${width}`, "character", true, { mode: "prompt" });
		await printAscii(entry);
	} else {
		await printLine(formatLine(entry), entry.type || "character", false, { mode: "prompt" });
	}

	if (state.pointer >= state.queue.length) {
		state.isStoryEnded = true;
	}
}

function printCommandEcho(rawCommand) {
	printLine(rawCommand, "character", true, { mode: "prompt" });
}

function normalizeCommand(input) {
	return input.trim().toLowerCase();
}

async function runCommand(rawCommand) {
	const command = normalizeCommand(rawCommand);

	if (!command) {
		return;
	}

	printCommandEcho(command);

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

	printLine(`Commande inconnue: ${command}`, "system", true);
	printLine("Tape 'help' pour voir les commandes.", "system", true);
}

commandInput.addEventListener("keydown", async (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		if (state.isTyping) {
			return;
		}

		const raw = commandInput.value;
		commandInput.value = "";
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
commandInput.focus();
