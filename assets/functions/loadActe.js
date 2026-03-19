import { state } from "./state.js";

export function loadActe(index) {
    const acte = state.actes[index];
    if (!acte) return;

    state.acteIndex = index;
    state.cheminIndex = null;
    state.cheminsDone = [];
    state.queue = [...(acte.panels || [])];
    state.pointer = 0;
    state.hasPrintedEnd = false;
    state.isStoryEnded = false;
    state.hasPromptedZoneChoice = false;
    state.awaitingZoneChoice = false;
    state.zones = {};

    // Construit les zones depuis les chemins de l'acte
    for (const chemin of acte.chemins || []) {
        state.zones[chemin.id] = {
            label: chemin.label,
            panels: chemin.panels || [],
        };
    }
}