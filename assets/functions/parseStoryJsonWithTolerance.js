import { preserveEscapedForwardSlash } from "./preserveEscapedForwardSlash.js";
import { sanitizeJsonBackslashes } from "./sanitizeJsonBackslashes.js";

export function parseStoryJsonWithTolerance(rawText) {
	const { normalized, convertedCount } = preserveEscapedForwardSlash(rawText);

	const direct = (() => {
		try {
			return { story: JSON.parse(normalized), fixedCount: 0, convertedCount };
		} catch {
			return null;
		}
	})();

	if (direct) {
		return direct;
	}

	const { sanitized, fixedCount } = sanitizeJsonBackslashes(normalized);
	return { story: JSON.parse(sanitized), fixedCount, convertedCount };
}