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
	asciiWidths: [41, 51, 71, 81, 101],
	asciiDefaultHeight: 12,
	history: [],
	historyPointer: -1,
};

const shellPath = "C:\\Users\\???\\???";
const classeParType = {
	system: "ligne_systeme",
	narrator: "ligne_narrateur",
	character: "ligne_perso",
};

function isHexDigit(char) {
	return /^[0-9a-fA-F]$/.test(char);
}

function isValidJsonEscape(source, slashIndex) {
	const next = source[slashIndex + 1];
	if (!next) {
		return false;
	}

	if (/^["\\/bfnrt]$/.test(next)) {
		return true;
	}

	if (next === "u") {
		const h1 = source[slashIndex + 2];
		const h2 = source[slashIndex + 3];
		const h3 = source[slashIndex + 4];
		const h4 = source[slashIndex + 5];
		return Boolean(h1 && h2 && h3 && h4)
			&& isHexDigit(h1)
			&& isHexDigit(h2)
			&& isHexDigit(h3)
			&& isHexDigit(h4);
	}

	return false;
}

function sanitizeJsonBackslashes(source) {
	let fixedCount = 0;
	let inString = false;
	let previousWasEscape = false;
	let result = "";

	for (let i = 0; i < source.length; i += 1) {
		const char = source[i];

		if (!inString) {
			result += char;
			if (char === '"') {
				inString = true;
			}
			continue;
		}

		if (char === '"' && !previousWasEscape) {
			inString = false;
			result += char;
			continue;
		}

		if (char === "\\" && !previousWasEscape) {
			if (isValidJsonEscape(source, i)) {
				result += char;
				previousWasEscape = true;
			} else {
				// Rend un antislash "isolé" valide en JSON (ex: C:\Users)
				result += "\\\\";
				fixedCount += 1;
				previousWasEscape = false;
			}
			continue;
		}

		result += char;
		if (previousWasEscape) {
			previousWasEscape = false;
		}
	}

	return { sanitized: result, fixedCount };
}

function preserveEscapedForwardSlash(source) {
	let convertedCount = 0;
	let inString = false;
	let previousWasEscape = false;
	let result = "";

	for (let i = 0; i < source.length; i += 1) {
		const char = source[i];

		if (!inString) {
			result += char;
			if (char === '"') {
				inString = true;
			}
			continue;
		}

		if (char === '"' && !previousWasEscape) {
			inString = false;
			result += char;
			continue;
		}

		if (char === "\\") {
			let runLength = 1;
			while (source[i + runLength] === "\\") {
				runLength += 1;
			}

			const afterRun = source[i + runLength];
			if (afterRun === "/") {
				const needsOneMore = runLength % 2 !== 0;
				result += "\\".repeat(runLength + (needsOneMore ? 1 : 0));
				result += "/";
				if (needsOneMore) {
					convertedCount += 1;
				}
				i += runLength;
				previousWasEscape = false;
				continue;
			}
		}

		result += char;
		if (char === "\\" && !previousWasEscape) {
			previousWasEscape = true;
		} else if (previousWasEscape) {
			previousWasEscape = false;
		}
	}

	return { normalized: result, convertedCount };
}

function parseStoryJsonWithTolerance(rawText) {
	const { normalized, convertedCount } = preserveEscapedForwardSlash(rawText);

	const direct = (() => {
		try {
			return { story: JSON.parse(normalized), fixedCount: 0, convertedCount };
		} catch {
			return null;
		}
	})();

	if (direct) {
		return direct;
	}

	const { sanitized, fixedCount } = sanitizeJsonBackslashes(normalized);
	return { story: JSON.parse(sanitized), fixedCount, convertedCount };
}

function skipWhitespace(source, startIndex) {
	let index = startIndex;
	while (index < source.length && /\s/.test(source[index])) {
		index += 1;
	}
	return index;
}

function decodeLiteralAsciiString(rawValue) {
	let result = "";

	for (let i = 0; i < rawValue.length; i += 1) {
		if (rawValue[i] === "\\" && rawValue[i + 1] === '"') {
			result += '"';
			i += 1;
			continue;
		}

		result += rawValue[i];
	}

	return result;
}

function readLiteralJsonString(source, startIndex) {
	let rawValue = "";
	let backslashRun = 0;

	for (let index = startIndex + 1; index < source.length; index += 1) {
		const char = source[index];

		if (char === '"' && backslashRun % 2 === 0) {
			return {
				value: decodeLiteralAsciiString(rawValue),
				endIndex: index + 1,
			};
		}

		rawValue += char;
		if (char === "\\") {
			backslashRun += 1;
		} else {
			backslashRun = 0;
		}
	}

	throw new Error("Chaine ASCII non terminee dans story.json");
}

function extractAsciiArraysFromSource(source) {
	const arrays = [];
	let inString = false;
	let previousWasEscape = false;

	for (let i = 0; i < source.length; i += 1) {
		const char = source[i];

		if (!inString) {
			if (source.startsWith('"ascii"', i)) {
				let cursor = skipWhitespace(source, i + '"ascii"'.length);
				if (source[cursor] !== ":") {
					continue;
				}

				cursor = skipWhitespace(source, cursor + 1);
				if (source[cursor] !== "[") {
					continue;
				}

				cursor += 1;
				const lines = [];

				while (cursor < source.length) {
					cursor = skipWhitespace(source, cursor);
					if (source[cursor] === "]") {
						arrays.push(lines);
						i = cursor;
						break;
					}

					if (source[cursor] === ",") {
						cursor += 1;
						continue;
					}

					if (source[cursor] !== '"') {
						throw new Error("Format ASCII invalide dans story.json");
					}

					const parsedString = readLiteralJsonString(source, cursor);
					lines.push(parsedString.value);
					cursor = parsedString.endIndex;
				}
			}

			if (char === '"') {
				inString = true;
			}
			continue;
		}

		if (char === '"' && !previousWasEscape) {
			inString = false;
			continue;
		}

		if (char === "\\" && !previousWasEscape) {
			previousWasEscape = true;
		} else if (previousWasEscape) {
			previousWasEscape = false;
		}
	}

	return arrays;
}

function restoreLiteralAsciiArrays(story, source) {
	const asciiArrays = extractAsciiArraysFromSource(source);
	let asciiIndex = 0;

	for (const panel of story.panels || []) {
		if (!Array.isArray(panel.ascii)) {
			continue;
		}

		const literalAscii = asciiArrays[asciiIndex];
		if (Array.isArray(literalAscii)) {
			panel.ascii = literalAscii;
		}
		asciiIndex += 1;
	}
}

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

		const storyText = await storyResponse.text();
		const { story, fixedCount, convertedCount } = parseStoryJsonWithTolerance(storyText);
		restoreLiteralAsciiArrays(story, storyText);
		const intro = Array.isArray(story.intro) ? story.intro : [];
		const panels = Array.isArray(story.panels) ? story.panels : [];

		state.queue = [...intro, ...panels];
		printLine(`Session ouverte: ${story.title || "Recit sans titre"}`, "system", true);
		printLine(`Fragments disponibles: ${panels.length}`, "system", true);
		printLine(`Presets ASCII: ${state.asciiWidths.join(", ")} colonnes`, "system", true);
		printLine("Commandes: next, help", "system", true);
		printLine("Tape 'next' puis Entree pour avancer.", "system", true);
		if (fixedCount > 0) {
			printLine(`Correction auto JSON: ${fixedCount} antislash(s) ajuste(s).`, "system", true);
		}
		if (convertedCount > 0) {
			printLine(`Correction auto JSON: ${convertedCount} sequence(s) '\\/' preservee(s).`, "system", true);
		}
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

function normalizeAsciiGlyphs(line) {
	return line
		.replace(/\r/g, "")
		.replace(/[▐▌│┃]/g, "|")
		.replace(/[▀▄─━]/g, "-")
		.replace(/[┌┐└┘]/g, "+");
}

function fitAsciiLines(lines, fallbackWidth) {
	const cleanLines = lines.map((line) => normalizeAsciiGlyphs(line));
	const widest = cleanLines.reduce((max, line) => Math.max(max, line.length), 0);
	const targetWidth = Math.max(Number(fallbackWidth) || 0, widest);

	return cleanLines.map((line) => {
		if (line.length > targetWidth) {
			return line.slice(0, targetWidth);
		}
		return line.padEnd(targetWidth, " ");
	});
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
	const requested = Number(entry.preset || entry.width || 71);
	const presetWidth = state.asciiWidths.includes(requested) ? requested : 71;
	const rawLines = normalizeAsciiLines(entry.ascii)
		|| buildAsciiPreset(presetWidth, state.asciiDefaultHeight, entry.label);
	const lines = fitAsciiLines(rawLines, presetWidth);

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
		mode: "plain",
		extraClass: "ligne_ascii",
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
		const width = Number(entry.preset || entry.width || 71);
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

	if (command === "ping") {
		printLine("pong", "character", true);
		return;
	}

	printLine(`Commande inconnue: ${command}`, "system", true);
	printLine("Tape 'help' pour voir les commandes.", "system", true);
}

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
commandInput.focus();