import { parseArgs } from "util";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import { promises as fs, Dirent } from "fs";
import * as path from "path";
import type { FileContext } from "../config/types";  

const { positionals } = parseArgs({
	args: Bun.argv,
	strict: true,
	allowPositionals: true,
});

// TODO: Getting recursive files does not add the recursive directories to path
// TODO: Recursive mode also does not exclude node_modules. Maybe it shouldn't?
async function getFilesRecursively(dirPath: string): Promise<FileContext[]> {
	const files: FileContext[] = [];
	const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			continue;
		}
		const fullPath = path.join(dirPath, entry.name);

		const fileContext = getValidFileContext(fullPath);
		if (fileContext) {
			files.push(fileContext);
		}
	}

	return files;
}

// TODO: What happens with TypeScript? Figure out running compiled or native?
function getValidFileContext(filePath: string): FileContext | undefined {
	const extension = path.extname(filePath);
	
	switch(extension) {
		case '.mjs': 
			return {
				type: "module",
				path: filePath,
			};
		case '.cjs':
			return {
				type: "commonjs",
				path: filePath,
			};
		case '.js':
			// TODO: Detect package.json/tsconfig file module/commonjs
			return undefined;
	}
}

async function parseFile(fileContext: FileContext) {
	const file = Bun.file(fileContext.path);
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
