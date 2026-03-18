import { isHexDigit } from "./isHexDigit.js";

export function isValidJsonEscape(source, slashIndex) {
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