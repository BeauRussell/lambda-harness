import parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { FileContext, Dependency } from "../../config/types";
import { logger } from "../utils/logger";

export async function parseFile(fileContext: FileContext): Promise<Dependency[]> {
	const file = Bun.file(fileContext.path);
	const code = await file.text();
	const dependencies: Dependency[] = [];
	const envVars: string[] = [];

	const ast = parser.parse(code);

	traverse(ast, {
		CallExpression: createCallExpressionVisitor(dependencies),
		MemberExpression: createMemberExpressionVisitor(envVars),
	});

	return dependencies;
}

function createCallExpressionVisitor(dependencies: Dependency[]) {
	return function (path: NodePath<t.CallExpression>) {
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
	};
}

function createMemberExpressionVisitor(envVars: string[]) {
	return function (path: NodePath<t.MemberExpression>) {
		const { node } = path;
		const { object, property, computed} = node;

		if (
			object.type === 'MemberExpression' &&
			object.object.type === 'Identifier' &&
			object.object.name === 'process' &&
			object.property.type === 'Identifier' &&
			object.property.name === 'env'
		) {
			if (computed && property.type === 'StringLiteral') {
				envVars.push(property.value);
			} else if (!computed && property.type === 'Identifier') {
				envVars.push(property.name);
			} else {
				logger.info('Found property that is dynamically accessed', node);
			}
		}
	};
}
