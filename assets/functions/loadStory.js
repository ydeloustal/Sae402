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