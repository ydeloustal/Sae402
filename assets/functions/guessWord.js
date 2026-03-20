import { state, commandInput } from "./state.js";
import { printLine } from "./printLine.js";

export function startGuessWord(entry, onSuccess) {
    // Support answer (singulier) et answers (pluriel)
    const answers = Array.isArray(entry.answers)
        ? entry.answers.map(a => a.trim().toLowerCase())
        : [(entry.answer || "").trim().toLowerCase()];

    const asciiLines = Array.isArray(entry.ascii) ? entry.ascii : null;

    const overlay = document.getElementById("guessWordChallenge");
    const asciiEl = document.getElementById("guessWordAscii");
    const input = document.getElementById("guessWordInput");
    const validateBtn = document.getElementById("guessWordValidate");
    const closeBtn = document.getElementById("guessWordClose");
    const reopenBtn = document.getElementById("guessWordReopen");
    const feedbackEl = document.getElementById("guessWordFeedback");

    let currentIndex = 0;

    function updatePrompt() {
        if (answers.length > 1) {
            input.placeholder = `Mot ${currentIndex + 1}/${answers.length}...`;
        } else {
            input.placeholder = "Votre réponse...";
        }
    }

    if (asciiLines) {
        asciiEl.textContent = asciiLines.join("\n");
        asciiEl.classList.remove("hidden");
    } else {
        asciiEl.classList.add("hidden");
    }

    input.value = "";
    feedbackEl.textContent = "";
    feedbackEl.className = "guess-word-feedback";
    reopenBtn.classList.add("hidden");
    overlay.classList.remove("hidden");
    updatePrompt();

    state.isTyping = true;
    commandInput.disabled = true;
    input.focus();

    function validate() {
        const typed = input.value.trim().toLowerCase();

        if (typed === answers[currentIndex]) {
            currentIndex += 1;
            input.value = "";
            feedbackEl.textContent = "";
            feedbackEl.className = "guess-word-feedback";

            if (currentIndex >= answers.length) {
                overlay.classList.add("hidden");
                reopenBtn.classList.add("hidden");
                commandInput.disabled = false;
                commandInput.focus();
                state.isTyping = false;
                printLine("Bonne réponse !", "system", true);
                onSuccess();
            } else {
                updatePrompt();
                printLine(`Mot ${currentIndex}/${answers.length} correct !`, "system", true);
                input.focus();
            }
        } else {
            feedbackEl.textContent = "Mauvaise réponse, réessayez.";
            feedbackEl.classList.add("incorrect");
            input.value = "";
            input.focus();
        }
    }

    function close() {
        overlay.classList.add("hidden");
        reopenBtn.classList.remove("hidden");
        commandInput.disabled = false;
        commandInput.focus();
    }

    function reopen() {
        overlay.classList.remove("hidden");
        reopenBtn.classList.add("hidden");
        commandInput.disabled = true;
        input.focus();
    }

    validateBtn.onclick = validate;
    closeBtn.onclick = close;
    reopenBtn.onclick = reopen;

    input.onkeydown = (e) => {
        if (e.key === "Enter") validate();
    };
}