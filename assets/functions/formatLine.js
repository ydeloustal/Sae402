export function formatLine(entry) {
	if (entry.speaker) {
		return `${entry.speaker}: ${entry.text}`;
	}

	return entry.text || "";
}