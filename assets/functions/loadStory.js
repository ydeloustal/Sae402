import { state, commandInput } from "./state.js";
import { parseStoryJsonWithTolerance } from "./parseStoryJsonWithTolerance.js";
import { restoreLiteralAsciiArrays } from "./restoreLiteralAsciiArrays.js";
import { printLine } from "./printLine.js";
import { loadActe } from "./loadActe.js";

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
		state.actes = Array.isArray(story.actes) ? story.actes : [];

		if (state.actes.length > 0) {
			loadActe(0);
			state.queue = [...intro, ...state.queue];
		} else {
			const panels = Array.isArray(story.panels) ? story.panels : [];
			state.queue = [...intro, ...panels];
		}

		printLine("Commandes: next, help", "system", true);
		printLine("Tape 'next' puis Entree pour avancer.", "system", true);
	} catch (error) {
		printLine("Erreur de chargement du récit JSON.", "system", true);
		printLine(String(error), "system", true);
		commandInput.disabled = true;
	}
}