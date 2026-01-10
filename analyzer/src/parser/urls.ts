import type { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import type { AnalysisContext, ResolvedUrl, UrlComponent } from '../../config/types';
import { getEnvVarName, isProcessEnvAccess, unwrapExpression } from '../utils/parse-utils';

export function resolveExpression(
	node: t.Expression | t.SpreadElement,
	scope: Scope,
	ctx: AnalysisContext,
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
		return resolveTemplateLiteral(node, scope, ctx, depth);
	}

	// Identifier: someUrl (variable)
	if (t.isIdentifier(node)) {
		return resolveIdentifier(node, scope, ctx, depth);
	}

	// Member expression: process.env.API_URL
	if (t.isMemberExpression(node)) {
		return resolveMemberExpression(node, ctx);
	}
	
	// Binary expression: baseUrl + "/endpoint"
	if (t.isBinaryExpression(node) && node.operator === '+') {
		return resolveBinaryExpression(node, scope, ctx, depth);
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
	ctx: AnalysisContext,
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
			const resolved = resolveExpression(unwrapped, scope, ctx, depth + 1);

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
	ctx: AnalysisContext,
	depth: number
): ResolvedUrl {
	const name = node.name;

	// Check if we've tracked this variable's assignment
	const initializer = ctx.varMap.get(name);
	if (initializer) {
		const resolved = resolveExpression(initializer, scope, ctx, depth + 1);

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

function resolveMemberExpression(
	node: t.MemberExpression,
	ctx: AnalysisContext,
): ResolvedUrl {
	if (isProcessEnvAccess(node)) {
		const envVarName = getEnvVarName(node);

		if (envVarName) {
			ctx.envVars.add(envVarName);

			return {
				components: [{ type: 'env', value: undefined, envVar: envVarName }],
				raw: `\${process.env.${envVarName}}`,
				envVars: [envVarName],
				isFullyStatic: false,
			};
		}

		// Dynamic access: process.env[someVar]
		return {
			components: [{ type: 'env', value: undefined }],
			raw: '${process.env.<dynamic>}',
			envVars: [],
			isFullyStatic: false,
		};
	}

	return {
		components: [{ type: 'unknown', value: undefined }],
		raw: '<member expression>',
		envVars: [],
		isFullyStatic: false,
	};
}

