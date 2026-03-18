import { decodeLiteralAsciiString } from "./decodeLiteralAsciiString.js";

export function readLiteralJsonString(source, startIndex) {
    let rawValue = "";
    let backslashRun = 0;

    for (let index = startIndex + 1; index < source.length; index += 1) {
        const char = source[index];

        if (char === '"' && backslashRun % 2 === 0) {
            return {
                value: decodeLiteralAsciiString(rawValue),
                endIndex: index + 1,
            };
        }

        rawValue += char;
        if (char === "\\") {
            backslashRun += 1;
        } else {
            backslashRun = 0;
        }
    }

    throw new Error("Chaine ASCII non terminee dans story.json");
}