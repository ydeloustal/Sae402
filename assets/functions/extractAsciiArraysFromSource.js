import { skipWhitespace } from "./skipWhitespace.js";
import { readLiteralJsonString } from "./readLiteralJsonString.js";

export function extractAsciiArraysFromSource(source) {
    const arrays = [];
    let inString = false;
    let previousWasEscape = false;

    for (let i = 0; i < source.length; i += 1) {
        const char = source[i];

        if (!inString) {
            if (source.startsWith('"ascii"', i)) {
                let cursor = skipWhitespace(source, i + '"ascii"'.length);
                if (source[cursor] !== ":") {
                    continue;
                }

                cursor = skipWhitespace(source, cursor + 1);
                if (source[cursor] !== "[") {
                    continue;
                }

                cursor += 1;
                const lines = [];

                while (cursor < source.length) {
                    cursor = skipWhitespace(source, cursor);
                    if (source[cursor] === "]") {
                        arrays.push(lines);
                        i = cursor;
                        break;
                    }

                    if (source[cursor] === ",") {
                        cursor += 1;
                        continue;
                    }

                    if (source[cursor] !== '"') {
                        throw new Error("Format ASCII invalide dans story.json");
                    }

                    const parsedString = readLiteralJsonString(source, cursor);
                    lines.push(parsedString.value);
                    cursor = parsedString.endIndex;
                }
            }

            if (char === '"') {
                inString = true;
            }
            continue;
        }

        if (char === '"' && !previousWasEscape) {
            inString = false;
            continue;
        }

        if (char === "\\" && !previousWasEscape) {
            previousWasEscape = true;
        } else if (previousWasEscape) {
            previousWasEscape = false;
        }
    }

    return arrays;
}