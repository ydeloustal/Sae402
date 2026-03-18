import { printLine } from "./printLine.js";

export function printCommandEcho(rawCommand) {
	printLine(rawCommand, "character", true, { mode: "prompt" });
}