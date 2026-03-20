import { state, commandInput } from "./state.js";
import { printLine } from "./printLine.js";

export function startGuessWord(entry, onSuccess) {
    const answers = Array.isArray(entry.answers)
        ? entry.answers.map(a => String(a).trim().toLowerCase())
        : [String(entry.answer || "").trim().toLowerCase()];

    const asciiLines = Array.isArray(entry.ascii) ? entry.ascii : null;

    if (asciiLines) {
        printLine(asciiLines.join("\n"), "character", true, { mode: "plain", extraClass: "ligne_ascii" });
    }

    const remaining = answers.length;
    if (remaining > 1) {
        printLine(`Trouvez ${remaining} mots pour continuer.`, "system", true);
    } else {
        printLine("Trouvez le mot pour continuer.", "system", true);
    }

    state.guessWordActive = true;
    state.guessWordAnswers = answers;
    state.guessWordFoundIndexes = [];
    state.guessWordCallback = onSuccess;
    state.isTyping = true;
    commandInput.disabled = false;
    commandInput.placeholder = remaining > 1 ? `${remaining} mot(s) restant(s)...` : "Votre réponse...";
    commandInput.focus();
}