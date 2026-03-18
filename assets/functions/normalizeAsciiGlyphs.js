export function normalizeAsciiGlyphs(line) {
    return line
        .replace(/\r/g, "")
        .replace(/[▐▌│┃]/g, "|")
        .replace(/[▀▄─━]/g, "-")
        .replace(/[┌┐└┘]/g, "+");
}