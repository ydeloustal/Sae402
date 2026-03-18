export function normalizeAsciiLines(value) {
	if (Array.isArray(value)) {
		return value.map((line) => String(line));
	}

	if (typeof value === "string") {
		return value.split("\n");
	}

	return null;
}