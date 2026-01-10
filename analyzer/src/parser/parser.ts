import { parse } from '@babel/parser';
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { AnalysisContext, AnalysisResult, HttpCall } from "../../config/types";
import { getEnvVarName, isProcessEnvAccess } from "../utils/parse-utils";
import { resolveExpression } from "./urls";

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
const HTTP_CLIENTS = new Set(['fetch', 'axios', 'got', 'request', 'superagent']);

// ============ Main Analyzer ============

export function analyzeLambda(code: string, filename: string): AnalysisResult {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  const ctx: AnalysisContext = {
    varMap: new Map(),
    envVars: new Set(),
  };

  const httpCalls: HttpCall[] = [];

  traverse(ast, {
    // Collect variable declarations
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id) && path.node.init) {
        ctx.varMap.set(path.node.id.name, path.node.init);
      }

      // Destructuring: const { VAR } = process.env
      if (
        t.isObjectPattern(path.node.id) &&
        t.isMemberExpression(path.node.init) &&
        t.isIdentifier(path.node.init.object, { name: 'process' }) &&
        t.isIdentifier(path.node.init.property, { name: 'env' })
      ) {
        for (const prop of path.node.id.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            ctx.envVars.add(prop.key.name);
          }
        }
      }
    },

    // Catch ALL process.env.X accesses (not just in URLs)
    MemberExpression(path) {
      if (isProcessEnvAccess(path.node)) {
        const name = getEnvVarName(path.node);
        if (name) {
          ctx.envVars.add(name);
        }
      }
    },

    // Detect HTTP calls
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      const loc = `${filename}:${path.node.loc?.start.line}`;

      let method: string | null = null;

      if (t.isIdentifier(callee) && HTTP_CLIENTS.has(callee.name)) {
        method = callee.name === 'fetch' ? 'GET' : 'unknown';
      }

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property) &&
        HTTP_CLIENTS.has(callee.object.name) &&
        HTTP_METHODS.has(callee.property.name)
      ) {
        method = callee.property.name.toUpperCase();
      }

      if (method && args[0] && t.isExpression(args[0])) {
        const url = resolveExpression(args[0], path.scope, ctx, 0);
        httpCalls.push({ url, method, location: loc });
      }
    },
  });

  return {
    envVars: ctx.envVars,
    httpCalls,
  };
}
