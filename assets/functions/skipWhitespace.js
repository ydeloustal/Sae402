export function skipWhitespace(source, startIndex) {
	let index = startIndex;
	while (index < source.length && /\s/.test(source[index])) {
		index += 1;
	}
	return index;
}