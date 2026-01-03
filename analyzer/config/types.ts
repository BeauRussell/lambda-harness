/*
	* Type mapping to Go's expected Result format
	*
	type AnalyzerResult struct {
		Handler     *HandlerConfig    `json:"handler"`
		Environment []EnvVarUsage     `json:"environment"`
		AWSServices []AWSServiceUsage `json:"awsServices"`
		Tests       []DiscoveredTest  `json:"tests"`
		Warnings    []string          `json:"warnings"`
	}

	type HandlerConfig struct {
		File       string `json:"file"`
		Export     string `json:"export"`
		Type       string `json:"type"`
		Confidence string `json:"confidence"`
		Source     string `json:"source"`
	}

	type EnvVarUsage struct {
		Name         string `json:"name"`
		HasDefault   bool   `json:"hasDefault"`
		DefaultValue string `json:"defaultValue,omitempty"`
	}

	type AWSServiceUsage struct {
		Service    string   `json:"service"`
		Operations []string `json:"operations"`
		SDKVersion string   `json:"sdkVersion"`
	}

	type DiscoveredTest struct {
		Name    string `json:"name"`
		Fixture string `json:"fixture"`
	}
*/

export type AnalyzerResult = {
	handler: HandlerConfig;
	environment: EnvVarUsage[];
	awsServices: AWSServiceUsage[];
	tests: DiscoveredTest[];
	warnings: string[];
}

// How the handler is setup for running in docker later
export type HandlerConfig = {
	file: string;
	export: string;
	type: string;
	confidence: string;
	source: string;
}

// Environment Variable structure for later setup
export type EnvVarUsage = {
	name: string;
	hasDefault: boolean;
	defaultValue?: string;
}

// Keeps track of each call to AWS SDK services, and if it's V2 or V3
export type AWSServiceUsage = {
	service: string;
	operations: string[];
	sdkVersion: string;
}

// What tests are created, and what package, if any
export type DiscoveredTest = {
	name: string;
	fixture: string;
}
