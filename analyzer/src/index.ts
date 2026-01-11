import { parseArgs } from "util";
import { promises as fs, Dirent } from "fs";
import * as path from "path";
import type { FileContext, PackageInfo, Dependency } from "../config/types";
import { logger } from "./utils/logger";
import { analyzeLambda } from "./parser/parser";

// TODO: Getting recursive files does not add the recursive directories to path
// TODO: Recursive mode also does not exclude node_modules. Maybe it shouldn't?
async function getFilesRecursively(dirPath: string): Promise<FileContext[]> {
	const files: FileContext[] = [];
	const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });

	const packageInfo = await attemptToGetPackageFile(dirPath);

	for (const entry of entries) {
		if (entry.isDirectory()) {
			continue;
		}
		const fullPath = path.join(dirPath, entry.name);

		const fileContext = getValidFileContext(fullPath, packageInfo);
		if (fileContext) {
			files.push(fileContext);
		}
	}

	return files;
}

function getValidFileContext(filePath: string, packageInfo: PackageInfo | undefined): FileContext | undefined {
	const extension = path.extname(filePath);
	
	switch(extension) {
		case '.mjs': 
			return {
				type: "module",
				path: filePath,
				packageInfo,
			};
		case '.cjs':
			return {
				type: "commonjs",
				path: filePath,
				packageInfo,
			};
		case '.js':
			if (packageInfo?.type) {
				return {
					type: packageInfo.type,
					path: filePath,
					packageInfo
				};
			} else {
				logger.debug({
					message: `Failed to find FileContext for file: ${filePath}`,
				});
				return undefined;
			}
	}
}

async function attemptToGetPackageFile(dirPath: string): Promise<PackageInfo | undefined> {
	try {
		const file = Bun.file(`${dirPath}/package.json`);
		const packageString = await file.text();
		return JSON.parse(packageString) as PackageInfo;
	} catch {
		return undefined;
	}

}

function packagesToDependencies(packages: Record<string,string> | undefined): Dependency[] {
	if (packages === undefined) {
		return [];
	}

	return Object.entries(packages).map(([name, value]) => ({ name, version: value }));
}

async function main(path: string | undefined): Promise<void> {
	if (!path) {
		console.error("No path passed into Analyzer");
		process.exit(1);
	}

	const files = await getFilesRecursively(path);
	const dependencies: Dependency[] = [];

	for (const file of files) {
		if (file.packageInfo) {
			dependencies.push(
				...packagesToDependencies(file.packageInfo.dependencies),
				...packagesToDependencies(file.packageInfo.peerDependencies),
				...packagesToDependencies(file.packageInfo.devDependencies),
			);
		} 
		
		const loadedFile = Bun.file(file.path);
		const code = await loadedFile.text();

		const results = analyzeLambda(code, file.path);

		logger.info('Analyzer results', { httpCalls: results.httpCalls, envVars: [...results.envVars] });
	}

	process.exit(0);
}

const { positionals } = parseArgs({
	args: Bun.argv,
	strict: true,
	allowPositionals: true,
});

await main(positionals[2]);
