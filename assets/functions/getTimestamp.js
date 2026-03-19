export function getTimestamp() {
	const now = new Date();
	return now.toLocaleTimeString("fr-FR", { hour12: false });
}