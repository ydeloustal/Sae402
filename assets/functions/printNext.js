import { state } from "./state.js";
import { printLine } from "./printLine.js";
import { printAscii } from "./printAscii.js";
import { formatLine } from "./formatLine.js";

export async function printNext() {
    if (state.isTyping) {
        return;
    }

    if (state.pointer >= state.queue.length) {
        if (!state.hasPrintedEnd) {
            printLine("Fin de transmission.", "system", true);
            state.hasPrintedEnd = true;
            state.isStoryEnded = true;
        }
        return;
    }

    const entry = state.queue[state.pointer];
    state.pointer += 1;

    if (entry.type === "ascii") {
        const width = Number(entry.preset || entry.width || 71);
        printLine(`Show-AsciiArt -Width ${width}`, "character", true, { mode: "prompt" });
        await printAscii(entry);
    } else {
        await printLine(formatLine(entry), entry.type || "character", false, { mode: "prompt" });
    }

    if (state.pointer >= state.queue.length) {
        state.isStoryEnded = true;
    }
}