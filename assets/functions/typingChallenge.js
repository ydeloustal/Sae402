import { state, commandInput } from "./state.js";
import { printLine } from "./printLine.js";

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur",
    "adipiscing", "elit", "sed", "do", "eiusmod", "tempor",
    "incididunt", "ut", "labore", "et", "dolore", "magna",
    "aliqua", "enim", "ad", "minim", "veniam", "quis",
    "nostrud", "exercitation", "ullamco", "laboris", "nisi",
    "aliquip", "commodo", "consequat", "duis", "aute", "irure",
    "reprehenderit", "voluptate", "velit", "esse", "cillum"
];

function getRandomWords(count) {
    const words = [];
    for (let i = 0; i < count; i++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
    }
    return words;
}

function buildWordSpans(words) {
    return words.map((word, wi) => {
        const letters = word.split("").map((letter, li) => {
            const cls = wi === 0 && li === 0 ? "letter current" : "letter";
            return `<span class="${cls}" data-wi="${wi}" data-li="${li}">${letter}</span>`;
        }).join("");
        return `<span class="word" data-wi="${wi}">${letters}</span>`;
    }).join(" ");
}

export function startTypingChallenge(entry, onSuccess) {
    const wordCount = entry.words || 20;
    let timeLimit = entry.time || 60;
    const words = getRandomWords(wordCount);

    const overlay = document.getElementById("typingChallenge");
    const wordsEl = document.getElementById("typingWords");
    const timerEl = document.getElementById("typingTimer");
    const input = document.getElementById("typingInput");
    const retryBtn = document.getElementById("typingRetry");

    overlay.classList.remove("hidden");
    overlay.classList.add("typing-challenge");
    wordsEl.classList.add("typing-words");
    timerEl.classList.add("typing-timer");
    retryBtn.classList.add("typing-retry");

    wordsEl.innerHTML = buildWordSpans(words);

    let currentWordIndex = 0;
    let currentLetterIndex = 0;
    let timeLeft = timeLimit;
    let timer = null;
    let finished = false;

    function updateTimer() {
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 10) {
            timerEl.classList.add("danger");
        }
        if (timeLeft <= 0) {
            clearInterval(timer);
            fail();
        }
        timeLeft -= 1;
    }

    function getLetter(wi, li) {
        return wordsEl.querySelector(`[data-wi="${wi}"][data-li="${li}"]`);
    }

    function getCurrentLetter() {
        return getLetter(currentWordIndex, currentLetterIndex);
    }

    function fail() {
        if (finished) return;
        finished = true;
        clearInterval(timer);
        timerEl.textContent = "Temps écoulé !";
        timerEl.classList.add("danger");
        retryBtn.classList.remove("hidden");
        input.disabled = true;
    }

    function success() {
        if (finished) return;
        finished = true;
        clearInterval(timer);
        overlay.classList.add("hidden");
        commandInput.disabled = false;
        commandInput.focus();
        state.isTyping = false;
        printLine("Défi réussi !", "system", true);
        onSuccess();
    }

    function reset() {
        console.log("reset appelé");
        clearInterval(timer);
        finished = false;
        currentWordIndex = 0;
        currentLetterIndex = 0;
        timeLimit += 10;
        timeLeft = timeLimit;
        timerEl.classList.remove("danger");
        retryBtn.classList.add("hidden");
        input.disabled = false;
        input.value = "";
        words.splice(0, words.length, ...getRandomWords(wordCount));
        wordsEl.innerHTML = buildWordSpans(words);
        timerEl.textContent = `${timeLeft}s`;
        timer = setInterval(updateTimer, 1000);
        input.focus();
    }

    input.value = "";
    input.disabled = false;
    retryBtn.classList.add("hidden");
    timerEl.textContent = `${timeLeft}s`;

    state.isTyping = true;
    commandInput.disabled = true;

    timer = setInterval(updateTimer, 1000);
    input.focus();

    input.addEventListener("input", () => {
        if (finished) return;

        const typed = input.value;
        const expectedWord = words[currentWordIndex];

        // Vérifie lettre par lettre
        for (let li = 0; li < expectedWord.length; li++) {
            const span = getLetter(currentWordIndex, li);
            if (!span) continue;
            span.classList.remove("correct", "incorrect", "current");

            if (li < typed.length) {
                span.classList.add(typed[li] === expectedWord[li] ? "correct" : "incorrect");
            } else if (li === typed.length) {
                span.classList.add("current");
            }
        }

        const isLastWord = currentWordIndex === words.length - 1;
        const isComplete = typed.trim() === expectedWord && (typed.endsWith(" ") || isLastWord && typed.trim().length === expectedWord.length);

        if (typed.endsWith(" ") || (isLastWord && typed.trim() === expectedWord)) {
            const typedWord = typed.trim();
            if (typedWord === expectedWord) {
                wordsEl.querySelector(`[data-wi="${currentWordIndex}"]`).classList.add("done");
                currentWordIndex += 1;
                currentLetterIndex = 0;
                input.value = "";

                if (currentWordIndex >= words.length) {
                    success();
                } else {
                    getLetter(currentWordIndex, 0)?.classList.add("current");
                }
            } else {
                input.value = "";
                for (let li = 0; li < expectedWord.length; li++) {
                    const span = getLetter(currentWordIndex, li);
                    if (span) {
                        span.classList.remove("correct", "incorrect", "current");
                        if (li === 0) span.classList.add("current");
                    }
                }
            }
        }
    });

    retryBtn.onclick = reset;
}