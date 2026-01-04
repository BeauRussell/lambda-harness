import { parseArgs } from "util";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import { promises as fs, Dirent } from "fs";
import * as path from "path";

const { positionals } = parseArgs({
	args: Bun.argv,
	strict: true,
	allowPositionals: true,
});

async function getFilesRecursively(dirPath: string): Promise<string[]> {
	const files: string[] = [];
	const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			continue;
		}
		const fullPath = path.join(dirPath, entry.name);

		if (checkValidFileType(fullPath)) {
			files.push(fullPath);
		}
	}

	return files;
}

function checkValidFileType(filePath: string): boolean {
	const validExtensions = ['.js', '.ts', '.mjs', '.cjs'];
	const extension = path.extname(filePath);
	return validExtensions.includes(extension);
}

async function main(path: string | undefined): Promise<void> {
	if (!path) {
		console.error("No path passed into Analyzer");
		process.exit(1);
	}

	const files = await getFilesRecursively(path);

	console.log(files);

	process.exit(0);
}

await main(positionals[2]);
