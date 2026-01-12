import type { AnalysisResult, Result } from "../../config/types";
/*
	* Due to the specific requirement of building a console log that matches exactly the expected response input
	* back to the Go orchestrator, this file should be kept separate and very carefully maintained.
*/

type Serializable<T> = {
	[K in keyof T]: T[K] extends Set<infer U> ? U[] : T[K];
}

type SerializableAnalysisResult = Serializable<AnalysisResult>;

type SerializableResult = Omit<Result, 'analysis'> & {
	analysis: SerializableAnalysisResult;
}

export function logResponse(analysis: Result) {
	const serializable: SerializableResult = {
		...analysis,
		analysis: {
			...analysis.analysis,
			envVars: [...analysis.analysis.envVars],
		}
	};

	console.log(JSON.stringify(serializable));
}
