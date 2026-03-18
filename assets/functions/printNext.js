import { state } from "./state.js";
import { printLine } from "./printLine.js";
import { printAscii } from "./printAscii.js";
import { formatLine } from "./formatLine.js";
import { printWait } from "./printWait.js";

export async function printNext() {
    if (state.isTyping) {
        return;
    }

    if (state.pointer >= state.queue.length) {
        if (!state.hasPromptedZoneChoice) {
            const hasZones = ["a", "b", "c"].some((key) => Array.isArray(state.zones[key]) && state.zones[key].length > 0);
            if (hasZones) {
                printLine("Choix de zone disponible: tape A, B ou C pour continuer.", "system", true);
                state.awaitingZoneChoice = true;
                state.hasPromptedZoneChoice = true;
                state.isStoryEnded = false;
                return;
            }
        }

        if (!state.hasPrintedEnd) {
            printLine("Fin de transmission.", "system", true);
            state.hasPrintedEnd = true;
            state.isStoryEnded = true;
        }
        return;
    }

    const entry = state.queue[state.pointer];
    state.pointer += 1;

    if (entry.path) {
        state.currentPath = entry.path.replace("/", "\\");
        const promptSpan = document.querySelector("#inputLine .invite_terminal");
        if (promptSpan) promptSpan.textContent = `${state.currentPath}>`;
    }

    if (entry.type === "ascii") {
        const width = Number(entry.preset || entry.width || 71);
        await printAscii(entry);
    } else if (entry.type === "wait") {
        await printWait(entry);
    } else {
        await printLine(formatLine(entry), entry.type || "character", false, { mode: "prompt" });
    }

    if (state.pointer >= state.queue.length) {
        if (!state.hasPromptedZoneChoice) {
            const hasZones = ["a", "b", "c"].some((key) => Array.isArray(state.zones[key]) && state.zones[key].length > 0);
            if (hasZones) {
                printLine("Choix de zone disponible: tape A, B ou C pour continuer.", "system", true);
                state.awaitingZoneChoice = true;
                state.hasPromptedZoneChoice = true;
                state.isStoryEnded = false;
                return;
            }
        }

        state.isStoryEnded = true;
    }
}