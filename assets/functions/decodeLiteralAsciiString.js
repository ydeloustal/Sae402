export function decodeLiteralAsciiString(rawValue) {
    let result = "";

    for (let i = 0; i < rawValue.length; i += 1) {
        if (rawValue[i] === "\\" && rawValue[i + 1] === '"') {
            result += '"';
            i += 1;
            continue;
        }

        result += rawValue[i];
    }

    return result;
}