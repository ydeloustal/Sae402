import { state, commandInput } from "./state.js";
import { printLine } from "./printLine.js";

export function startKillVirus(onSuccess) {
    const overlay = document.getElementById("killVirusOverlay");
    overlay.classList.remove("hidden");

    state.isTyping = true;
    commandInput.disabled = true;

    const confirmBtn = document.getElementById("killVirusConfirm");
    confirmBtn.onclick = () => {
        overlay.classList.add("hidden");
        state.isTyping = false;
        commandInput.disabled = false;
        commandInput.focus();
        onSuccess();
    };
}