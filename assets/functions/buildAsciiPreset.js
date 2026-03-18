export function buildAsciiPreset(width, height, label) {
    const safeWidth = Math.max(12, Math.floor(width));
    const safeHeight = Math.max(6, Math.floor(height));
    const horizontal = "-".repeat(safeWidth - 2);
    const top = `+${horizontal}+`;
    const middle = [];
    const centerRow = Math.floor((safeHeight - 2) / 2);
    const text = (label || `ASCII PRESET ${safeWidth}`).toUpperCase();

    for (let i = 0; i < safeHeight - 2; i += 1) {
        if (i === centerRow) {
            const maxTextLength = Math.max(0, safeWidth - 4);
            const trimmed = text.slice(0, maxTextLength);
            const leftPad = Math.floor((safeWidth - 2 - trimmed.length) / 2);
            const rightPad = safeWidth - 2 - trimmed.length - leftPad;
            middle.push(`|${" ".repeat(leftPad)}${trimmed}${" ".repeat(rightPad)}|`);
        } else {
            middle.push(`|${" ".repeat(safeWidth - 2)}|`);
        }
    }

    return [top, ...middle, top];
}