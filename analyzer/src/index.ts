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

// TODO: Getting recursive files does not add the recursive directories to path
async function getFilesRecursively(dirPath: string): Promise<string[]> {
	const files: string[] = [];
	const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });

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

async function parseFile(path: string) {
	const file = Bun.file(path);
	const code = await file.text();

	const ast = parser.parse(code);

	traverse(ast, {
		enter(path) {
			if (path.isImport()) {
				console.log(path);
			}
		}
	});
}

async function main(path: string | undefined): Promise<void> {
	if (!path) {
		console.error("No path passed into Analyzer");
		process.exit(1);
	}

	const files = await getFilesRecursively(path);

	for (const file of files) {
		await parseFile(file);
	}

	process.exit(0);
}

await main(positionals[2]);
