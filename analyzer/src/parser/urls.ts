import type { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import type { ResolvedUrl, UrlComponent, VariableMap } from '../../config/types';
import {  unwrapExpression } from '../utils/ts-utils';

export function resolveExpression(
	node: t.Expression | t.SpreadElement,
	scope: Scope,
	varMap: VariableMap,
	depth = 0
): ResolvedUrl {
	if (depth > 10) {
		return {
			components: [{ type: 'unknown', value: undefined }],
			raw: '<max depth>',
			envVars: [],
			isFullyStatic: false,
		};
	}

	// Unwrap any TypeScript annotations
	if (t.isExpression(node)) {
		node = unwrapExpression(node);
	}

	// String literal: "https://api.example.com"
	if (t.isStringLiteral(node)) {
		return {
			components: [{ type: 'literal', value: node.value }],
			raw: node.value,
			envVars: [],
			isFullyStatic: true,
		};
	}

	// Template literal: `https://${host}/api/${path}`
	if (t.isTemplateLiteral(node)) {
		return resolveTemplateLiteral(node, scope, varMap, depth);
	}

	// Identifier: someUrl (variable)
	if (t.isIdentifier(node)) {
		return resolveIdentifier(node, scope, varMap, depth);
	}

	// Member expression: process.env.API_URL
	if (t.isMemberExpression(node)) {
		return resolveMemberExpression(node, scope, varMap, depth);
	}
	
	// Binary expression: baseUrl + "/endpoint"
	if (t.isBinaryExpression(node) && node.operator === '+') {
		return resolveBinaryExpression(node, scope, varMap, depth);
	}

	// Call expression: getBaseUrl() or url.toString()
	if (t.isCallExpression(node)) {
		return {
			components: [{ type: 'unknown', value: undefined }],
			raw: '<function call>',
			envVars: [],
			isFullyStatic: false,
		};
	}

	return {
		components: [{ type: 'unknown', value: undefined }],
		raw: '<unknown>',
		envVars: [],
		isFullyStatic: false,
	};
}

function resolveTemplateLiteral(
	node: t.TemplateLiteral,
	scope: Scope,
	varMap: VariableMap,
	depth: number
): ResolvedUrl {
	const components: UrlComponent[] = [];
	const envVars: string[] = [];
	let raw = '';
	let isFullyStatic = true;

	// Template literals interleave quasis (static parts) and expressions
	// `hello ${world} foo ${bar}` has:
	//   quasis: ['hello ', ' foo ', '']
	//   expressions: [world, bar]

	for (let i = 0; i < node.quasis.length; i++) {
		const quasi = node.quasis[i]!;

		if (quasi.value.cooked) {
			components.push({ type: 'literal', value: quasi.value.cooked });
			raw += quasi.value.cooked;
		}

		if (i < node.expressions.length) {
			const expr = node.expressions[i];

			// Skip if it's a TSType node
			if (!t.isExpression(expr)) {
				components.push({ type: 'unknown', value: undefined });
				raw += '<type>';
				isFullyStatic = false;
				continue;
			}

			const unwrapped = t.isTSAsExpression(expr) ? expr.expression : expr;
			const resolved = resolveExpression(unwrapped, scope, varMap, depth + 1);

			components.push(...resolved.components);
			envVars.push(...resolved.envVars);
			raw += resolved.raw;

			if (!resolved.isFullyStatic) {
				isFullyStatic = false;
			}
		}
	}

	return { components, raw, envVars, isFullyStatic };
}

function resolveIdentifier(
	node: t.Identifier,
	scope: Scope,
	varMap: VariableMap,
	depth: number
): ResolvedUrl {
	const name = node.name;

	// Check if we've tracked this variable's assignment
	const initializer = varMap.get(name);
	if (initializer) {
		const resolved = resolveExpression(initializer, scope, varMap, depth + 1);

		return {
			...resolved,
			components: resolved.components.map((c) =>
				c.type === 'literal' ? { ...c, type: 'variable' as const, varName: name } : c
			),
		};
	}

	return {
		components: [{ type: 'variable', value: undefined, varName: name }],
		raw: `\${${name}}`,
		envVars: [],
		isFullyStatic: false,
	};
}

