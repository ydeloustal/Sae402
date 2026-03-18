import { isValidJsonEscape } from "./isValidJsonEscape.js";

export function sanitizeJsonBackslashes(source) {
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