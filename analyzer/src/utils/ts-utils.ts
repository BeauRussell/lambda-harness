import * as t from '@babel/types';

/**
	* Helper functions that take an expression and strips out any TypeScipt annotation to the runtime expression
	* Handles: value as Type, value!, value satisfies Type
*/
type TSExpressionWrapper =
	| t.TSAsExpression
	| t.TSNonNullExpression
	| t.TSSatisfiesExpression

  const TS_WRAPPER_TYPES = new Set([
	  'TSAsExpression',
	  'TSNonNullExpression',
	  'TSSatisfiesExpression',
  ]);

  function isTSExpressionWrapper(node: t.Node): node is TSExpressionWrapper {
	  return TS_WRAPPER_TYPES.has(node.type);
  }

  export function unwrapExpression(expr: t.Expression): t.Expression {
	  while (isTSExpressionWrapper(expr) || t.isParenthesizedExpression(expr)) {
		  expr = expr.expression;
	  }
	  return expr;
  }
