export function getTimestamp() {
	const now = new Date();
	const date = now.toLocaleDateString("fr-FR");
	const time = now.toLocaleTimeString("fr-FR", { hour12: false });
	return `${date} ${time}`;
}