import { state, commandInput } from "./state.js";
import { parseStoryJsonWithTolerance } from "./parseStoryJsonWithTolerance.js";
import { restoreLiteralAsciiArrays } from "./restoreLiteralAsciiArrays.js";
import { printLine } from "./printLine.js";

export async function loadStory() {
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
		
		const zones = {};
		if (story.zones && typeof story.zones === "object") {
			for (const [key, value] of Object.entries(story.zones)) {
				zones[key] = {
					label: value.label || key.toUpperCase(),
					panels: Array.isArray(value.panels) ? value.panels : [],
				};
			}
		}
		state.zones = zones;

		printLine("Commandes: next, help", "system", true);
		printLine("Tape 'next' puis Entree pour avancer.", "system", true);
	} catch (error) {
		printLine("Erreur de chargement du récit JSON.", "system", true);
		printLine(String(error), "system", true);
		commandInput.disabled = true;
	}
}