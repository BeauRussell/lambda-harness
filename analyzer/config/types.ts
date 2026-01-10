import * as t from '@babel/types';

export type AnalyzerResult = {
	handler: HandlerConfig;
	environment: EnvVarUsage[];
	awsServices: AWSServiceUsage[];
	tests: DiscoveredTest[];
	warnings: string[];
	dependencies: Dependency[];
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

export type Dependency = {
	name: string; 
	version: string | undefined; 
}

type BaseFileContext = {
	path: string;
	packageJsonPath?: string;
	allowJs?: boolean;
	packageInfo: PackageInfo | undefined;
} 

export type ModuleType = "commonjs" | "module";

export type CommonJSContext = BaseFileContext & {
	type: "commonjs";
}

export type ModuleJSContext = BaseFileContext & {
	type: "module";
}

export type FileContext = CommonJSContext | ModuleJSContext;

export type PackageInfo = {
	type: ModuleType;
	main: string;
	engines?: Record<string, string>;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export type UrlComponent = {
	type: 'literal' | 'env' | 'variable' | 'unknown';
	value: string | undefined;
	envVar?: string;
	varName?: string;
}

export type ResolvedUrl = {
	components: UrlComponent[];
	raw: string;
	envVars: string[];
	isFullyStatic: boolean;
}

export type HttpCall = {
	url: ResolvedUrl;
	method: string;
	location: string;
}

export type ParserResult = {
	envVars: Set<string>;
	httpCalls: HttpCall[];
}

export type VariableMap = Map<string, t.Expression>;

export type AnalysisContext = {
	varMap: VariableMap;
	envVars: Set<string>;
}

export type AnalysisResult = {
  envVars: Set<string>;
  httpCalls: HttpCall[];
}
