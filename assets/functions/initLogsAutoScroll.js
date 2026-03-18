export function initLogsAutoScroll() {
	const logsList = document.querySelector(".aside-log ul");
	if (!logsList) return;

	const RESUME_DELAY_MS = 4000;
	const SCROLL_SPEED_PX_PER_SECOND = 18;
	let autoScrollEnabled = true;
	let resumeTimer = null;
	let isProgrammaticScroll = false;
	let lastFrameTime = performance.now();
	let smoothScrollTop = logsList.scrollTop;

	const scrollLogsToTop = () => {
		isProgrammaticScroll = true;
		smoothScrollTop = 0;
		logsList.scrollTop = 0;
		requestAnimationFrame(() => {
			isProgrammaticScroll = false;
		});
	};

	const hasScrollableContent = () => logsList.scrollHeight > logsList.clientHeight;

	const runAutoScroll = (now) => {
		const deltaSeconds = (now - lastFrameTime) / 2000;
		lastFrameTime = now;

		if (autoScrollEnabled && hasScrollableContent()) {
			const maxScrollTop = logsList.scrollHeight - logsList.clientHeight;
			const nextScrollTop = smoothScrollTop + deltaSeconds * SCROLL_SPEED_PX_PER_SECOND;

			if (nextScrollTop >= maxScrollTop - 1) {
				scrollLogsToTop();
			} else {
				isProgrammaticScroll = true;
				smoothScrollTop = nextScrollTop;
				logsList.scrollTop = smoothScrollTop;
				requestAnimationFrame(() => {
					isProgrammaticScroll = false;
				});
			}
		}

		requestAnimationFrame(runAutoScroll);
	};

	const scheduleResume = () => {
		autoScrollEnabled = false;
		smoothScrollTop = logsList.scrollTop;
		if (resumeTimer) {
			clearTimeout(resumeTimer);
		}
		resumeTimer = setTimeout(() => {
			autoScrollEnabled = true;
			lastFrameTime = performance.now();
			smoothScrollTop = logsList.scrollTop;
		}, RESUME_DELAY_MS);
	};

	logsList.addEventListener("wheel", scheduleResume, { passive: true });
	logsList.addEventListener("touchstart", scheduleResume, { passive: true });
	logsList.addEventListener("pointerdown", scheduleResume);
	logsList.addEventListener("keydown", scheduleResume);

	logsList.addEventListener("scroll", () => {
		if (!isProgrammaticScroll) {
			smoothScrollTop = logsList.scrollTop;
			scheduleResume();
		}
	});

	requestAnimationFrame(runAutoScroll);
}