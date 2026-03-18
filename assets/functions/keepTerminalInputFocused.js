export function keepTerminalInputFocused(commandInput) {
	const refocus = () => {
		if (document.activeElement !== commandInput) {
			commandInput.focus({ preventScroll: true });
		}
	};

	// Refocus après un clic/touch hors input, sans bloquer l'interaction en cours.
	const refocusAfterInteraction = (event) => {
		if (event.target === commandInput) return;
		requestAnimationFrame(refocus);
	};

	document.addEventListener("pointerdown", refocusAfterInteraction, true);
	document.addEventListener("touchstart", refocusAfterInteraction, true);

	// Si un autre élément prend le focus (tabulation, script), on revient sur l'input.
	document.addEventListener("focusin", (event) => {
		if (event.target === commandInput) return;
		requestAnimationFrame(refocus);
	}, true);

	window.addEventListener("focus", refocus);

	refocus();
}