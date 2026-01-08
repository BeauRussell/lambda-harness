import parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { FileContext, Dependency } from "../config/types";

export async function parseFile(fileContext: FileContext): Promise<Dependency[]> {
	const file = Bun.file(fileContext.path);
	const code = await file.text();
	const dependencies: Dependency[] = [];

	const ast = parser.parse(code);

	traverse(ast, {
		CallExpression(path) {
			const { node } = path;

			// Check if callee is `require`
			if (t.isIdentifier(node.callee, { name: 'require' }) && node.arguments.length === 1) {

				const arg = node.arguments[0];

				// Only capture static string literals (skip dynamic requires)
				if (t.isStringLiteral(arg)) {
					const moduleName = arg.value;

					dependencies.push({ name: moduleName, version: undefined });
				}
			}
		}
	});

	return dependencies;
}
