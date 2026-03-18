export function preserveEscapedForwardSlash(source) {
    let convertedCount = 0;
    let inString = false;
    let previousWasEscape = false;
    let result = "";

    for (let i = 0; i < source.length; i += 1) {
        const char = source[i];

        if (!inString) {
            result += char;
            if (char === '"') {
                inString = true;
            }
            continue;
        }

        if (char === '"' && !previousWasEscape) {
            inString = false;
            result += char;
            continue;
        }

        if (char === "\\") {
            let runLength = 1;
            while (source[i + runLength] === "\\") {
                runLength += 1;
            }

            const afterRun = source[i + runLength];
            if (afterRun === "/") {
                const needsOneMore = runLength % 2 !== 0;
                result += "\\".repeat(runLength + (needsOneMore ? 1 : 0));
                result += "/";
                if (needsOneMore) {
                    convertedCount += 1;
                }
                i += runLength;
                previousWasEscape = false;
                continue;
            }
        }

        result += char;
        if (char === "\\" && !previousWasEscape) {
            previousWasEscape = true;
        } else if (previousWasEscape) {
            previousWasEscape = false;
        }
    }

    return { normalized: result, convertedCount };
}