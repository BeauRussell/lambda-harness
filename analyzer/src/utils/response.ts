import type { Result } from "../../config/types";
/*
	* Due to the specific requirement of building a console log that matches exactly the expected response input
	* back to the Go orchestrator, this file should be kept separate and very carefully maintained.
*/
export function logResponse(analysis: Result) {
	console.log(analysis);
}
