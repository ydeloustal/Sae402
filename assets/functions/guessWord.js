import { state, commandInput } from "./state.js";
import { printLine } from "./printLine.js";

export function startGuessWord(entry, onSuccess) {
    const answer = (entry.answer || "").trim().toLowerCase();
    const asciiLines = Array.isArray(entry.ascii) ? entry.ascii : null;

    const overlay = document.getElementById("guessWordChallenge");
    const asciiEl = document.getElementById("guessWordAscii");
    const input = document.getElementById("guessWordInput");
    const validateBtn = document.getElementById("guessWordValidate");
    const closeBtn = document.getElementById("guessWordClose");
    const reopenBtn = document.getElementById("guessWordReopen");
    const feedbackEl = document.getElementById("guessWordFeedback");

    // Affiche ou cache l'ascii
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

    state.isTyping = true;
    commandInput.disabled = true;
    input.focus();

    function validate() {
        const typed = input.value.trim().toLowerCase();
        if (typed === answer) {
            overlay.classList.add("hidden");
            reopenBtn.classList.add("hidden");
            commandInput.disabled = false;
            commandInput.focus();
            state.isTyping = false;
            printLine("Bonne réponse !", "system", true);
            onSuccess();
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