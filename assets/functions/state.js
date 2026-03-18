export const terminalBody = document.getElementById("terminalBody");
export const commandInput = document.getElementById("commandInput");
export const inputLine = document.getElementById("inputLine");

export const classeParType = {
    system: "ligne_systeme",
    narrator: "ligne_narrateur",
    character: "ligne_perso",
};

export const state = {
    queue: [],
    zones: {},
    pointer: 0,
    isTyping: false,
    hasPrintedEnd: false,
    isStoryEnded: false,
    awaitingZoneChoice: false,
    hasPromptedZoneChoice: false,
    hasTypedOnce: false,
    asciiWidths: [43, 53, 73, 83, 103],
    asciiDefaultHeight: 12,
    history: [],
    historyPointer: -1,
    commandLogs: [],
    currentPath: "User",
};

export const shellPath = "User";