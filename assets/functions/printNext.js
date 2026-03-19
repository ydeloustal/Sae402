import { state } from "./state.js";
import { printLine } from "./printLine.js";
import { printAscii } from "./printAscii.js";
import { formatLine } from "./formatLine.js";
import { printWait } from "./printWait.js";
import { loadActe } from "./loadActe.js";

async function handleEndOfQueue() {
    if (!state.hasPromptedZoneChoice) {
        const zoneKeys = Object.keys(state.zones).filter(
            (key) => Array.isArray(state.zones[key].panels) && state.zones[key].panels.length > 0
        );
        if (zoneKeys.length > 0) {
            printLine("Quel chemin voulez vous emprunter :", "system", true);
            zoneKeys.forEach((key, i) => {
                printLine(`${i + 1} - ${state.zones[key].label}`, "system", true);
            });
            const numeros = zoneKeys.map((_, i) => i + 1);
            printLine(`Ecrivez ${numeros.join(" ou ")} dans votre terminal.`, "system", true);
            state.awaitingZoneChoice = true;
            state.hasPromptedZoneChoice = true;
            state.isStoryEnded = false;
            return;
        }
    }

    if (state.cheminIndex !== null) {
        if (!state.cheminsDone.includes(state.cheminIndex)) {
            state.cheminsDone.push(state.cheminIndex);
        }

        const acte = state.actes[state.acteIndex];
        const chemins = acte?.chemins || [];
        const autresChemin = chemins.find(
            (c) => !state.cheminsDone.includes(c.id)
        );

        if (autresChemin) {
            printLine(`Vous avez terminé ce chemin. Le chemin "${autresChemin.label}" vous attend.`, "system", true);
            state.queue = [...autresChemin.panels];
            state.pointer = 0;
            state.cheminIndex = autresChemin.id;
            state.hasPrintedEnd = false;
            state.isStoryEnded = false;
            return;
        }

        const nextActeIndex = state.acteIndex + 1;
        if (nextActeIndex < state.actes.length) {
            printLine(`Acte ${nextActeIndex + 1}...`, "system", true);
            loadActe(nextActeIndex);
            await printNext();
            return;
        }
    }

    if (!state.hasPrintedEnd) {
        printLine("Fin de transmission.", "system", true);
        state.hasPrintedEnd = true;
        state.isStoryEnded = true;
    }
}

export async function printNext() {
    if (state.isTyping) return;

    if (state.pointer >= state.queue.length) {
        await handleEndOfQueue();
        return;
    }

    const entry = state.queue[state.pointer];
    state.pointer += 1;

    if (entry.path) {
        state.currentPath = entry.path.replace("/", "\\");
        const promptSpan = document.querySelector("#inputLine .invite_terminal");
        if (promptSpan) promptSpan.textContent = `${state.currentPath}>`;
    }

    if (entry.checkpoint) {
        state.lastCheckpoint = state.pointer - 1;
        state.checkpointQueue = [...state.queue];
    }

    const hints = {};
    let hintIndex = 1;
    while (entry[`hint${hintIndex}`] !== undefined) {
        hints[hintIndex] = entry[`hint${hintIndex}`];
        hintIndex += 1;
    }
    if (hintIndex > 1) {
        state.currentHints = hints;
        state.currentHintIndex = 1;
    }

    if (entry.type === "ascii") {
        await printAscii(entry);
    } else if (entry.type === "wait") {
        await printWait(entry);
    } else {
        await printLine(formatLine(entry), entry.type || "character", false, { mode: "prompt" });
    }

    if (entry.autonext) {
        await printNext();
        return;
    }

    if (state.pointer >= state.queue.length) {
        await handleEndOfQueue();
    }
}