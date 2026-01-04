import { parseArgs } from "util";
import * as parser from "@babel/parser";
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
	const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...await getFilesRecursively(fullPath));
		} else if (entry.isFile()) {
			files.push(fullPath);
		}
	}

	return files;
}

async function main(path: string | undefined): Promise<void> {
	if (!path) {
		console.error("No path passed into Analyzer");
		process.exit(1);
	}

	const files = await getFilesRecursively(path);

	process.exit(0);
}

await main(positionals[2]);
