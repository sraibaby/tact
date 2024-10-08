import { CompilerContext } from "./context";
import {
    AstBinaryOperation,
    AstExpression,
    SrcInfo,
    AstUnaryOperation,
    AstValue,
    isValue,
} from "./grammar/ast";
import { TactConstEvalError } from "./errors";
import { Value } from "./types/types";
import {
    extractValue,
    makeValueExpression,
    makeUnaryExpression,
    makeBinaryExpression,
} from "./optimizer/util";
import { ExpressionTransformer } from "./optimizer/types";
import { StandardOptimizer } from "./optimizer/standardOptimizer";
import {
    Interpreter,
    defaultInterpreterConfig,
    ensureInt,
    evalBinaryOp,
    evalUnaryOp,
    throwNonFatalErrorConstEval,
} from "./interpreter";

// The optimizer that applies the rewriting rules during partial evaluation.
// For the moment we use an optimizer that respects overflows.
const optimizer: ExpressionTransformer = new StandardOptimizer();

function partiallyEvalUnaryOp(
    op: AstUnaryOperation,
    operand: AstExpression,
    source: SrcInfo,
    ctx: CompilerContext,
    interpreter: Interpreter,
): AstExpression {
    if (operand.kind === "number" && op === "-") {
        // emulating negative integer literals
        return makeValueExpression(ensureInt(-operand.value, source, interpreter.config.checkValueBoundsInExpressions));
    }

    const simplOperand = partiallyEvalExpression_(operand, ctx, interpreter);

    if (isValue(simplOperand)) {
        const valueOperand = extractValue(simplOperand as AstValue);
        const result = evalUnaryOp(op, valueOperand, interpreter.config.checkValueBoundsInExpressions, simplOperand.loc, source);
        // Wrap the value into a Tree to continue simplifications
        return makeValueExpression(result);
    } else {
        const newAst = makeUnaryExpression(op, simplOperand);
        return optimizer.applyRules(newAst);
    }
}

function partiallyEvalBinaryOp(
    op: AstBinaryOperation,
    left: AstExpression,
    right: AstExpression,
    source: SrcInfo,
    ctx: CompilerContext,
    interpreter: Interpreter,
): AstExpression {
    const leftOperand = partiallyEvalExpression_(left, ctx, interpreter);
    const rightOperand = partiallyEvalExpression_(right, ctx, interpreter);

    if (isValue(leftOperand) && isValue(rightOperand)) {
        const valueLeftOperand = extractValue(leftOperand as AstValue);
        const valueRightOperand = extractValue(rightOperand as AstValue);
        const result = evalBinaryOp(
            op,
            valueLeftOperand,
            valueRightOperand,
            interpreter.config.checkValueBoundsInExpressions,
            leftOperand.loc,
            rightOperand.loc,
            source,
        );
        // Wrap the value into a Tree to continue simplifications
        return makeValueExpression(result);
    } else {
        const newAst = makeBinaryExpression(op, leftOperand, rightOperand);
        return optimizer.applyRules(newAst);
    }
}

function ensureValueBounds(val: Value, source: SrcInfo, boundCheck: boolean): Value {
    if (typeof val === "bigint") {
        return ensureInt(val, source, boundCheck);
    } else if (val !== null && typeof val === "object" && "$tactStruct" in val) {
        Object.entries(val).forEach(([_, v]) => {
            ensureValueBounds(v, source, boundCheck);
        });
        return val;
    } else {
        return val;
    }
}

export function evalConstantExpression(
    ast: AstExpression,
    ctx: CompilerContext,
): Value {
    // Explicitly deactivate the option to check value bounds in expressions 
    const interpreter = new Interpreter(ctx, {...defaultInterpreterConfig, checkValueBoundsInExpressions: false});
    const result = interpreter.interpretExpression(ast);
    
    // But we need to check the bounds in the final value.
    return ensureValueBounds(result, ast.loc, interpreter.config.checkValueBoundsInExpressions);
}

export function partiallyEvalExpression(
    ast: AstExpression,
    ctx: CompilerContext,
): AstExpression {
    // For the partial evaluator, bounding checking is trickier. 
    
    // If evaluation actually results in a single value, then we just need to check the bounds at the end.
    // But if evaluation fails to return a single value, we must carry out partial evaluation with 
    // bound checking activated, because the partial expression will be part of the final program!

    // Hence, we need to make two evaluation passes to the expression. 
    
    // First pass: attempt to fully evaluate with bound checking deactivated.

    try {
        const interpreter = new Interpreter(ctx, {...defaultInterpreterConfig, checkValueBoundsInExpressions: false});
        const result = interpreter.interpretExpression(ast);

        // Then, check the bounds in the end
        return makeValueExpression(ensureValueBounds(result, ast.loc, interpreter.config.checkValueBoundsInExpressions));
    } catch (e) {
        if (e instanceof TactConstEvalError) {
            if (!e.fatal) {
                // If a non-fatal error occurs, the second pass should be attempted
                // (this time carrying out partial evaluation), but with bound checking activated.
                const interpreter = new Interpreter(ctx); // By default, new interpreters activate bound checking
                
                // NOTE: The fact that we need to pass around the interpreter object to the partial
                // evaluator functions, signals that the partial evaluator is an instance of an abstract
                // interpreter: this should be refactored once the abstract interpreter is merged into main.
                return partiallyEvalExpression_(ast, ctx, interpreter);
            }
        }
        throw e;
    }
}

function partiallyEvalExpression_(
    ast: AstExpression,
    ctx: CompilerContext,
    interpreter: Interpreter,
): AstExpression {
    switch (ast.kind) {
        case "id":
            try {
                return makeValueExpression(interpreter.interpretName(ast));
            } catch (e) {
                if (e instanceof TactConstEvalError) {
                    if (!e.fatal) {
                        // If a non-fatal error occurs during lookup, just return the symbol
                        return ast;
                    }
                }
                throw e;
            }
        case "method_call":
            // Does not partially evaluate at the moment. Will attempt to fully evaluate
            return makeValueExpression(interpreter.interpretMethodCall(ast));
        case "init_of":
            throwNonFatalErrorConstEval(
                "initOf is not supported at this moment",
                ast.loc,
            );
            break;
        case "null":
            return ast;
        case "boolean":
            return ast;
        case "number":
            return makeValueExpression(interpreter.interpretNumber(ast));
        case "string":
            return makeValueExpression(interpreter.interpretString(ast));
        case "op_unary":
            return partiallyEvalUnaryOp(ast.op, ast.operand, ast.loc, ctx, interpreter);
        case "op_binary":
            return partiallyEvalBinaryOp(
                ast.op,
                ast.left,
                ast.right,
                ast.loc,
                ctx,
                interpreter
            );
        case "conditional":
            // Does not partially evaluate at the moment. Will attempt to fully evaluate
            return makeValueExpression(interpreter.interpretConditional(ast));
        case "struct_instance":
            // Does not partially evaluate at the moment. Will attempt to fully evaluate
            return makeValueExpression(
                interpreter.interpretStructInstance(ast),
            );
        case "field_access":
            // Does not partially evaluate at the moment. Will attempt to fully evaluate
            return makeValueExpression(interpreter.interpretFieldAccess(ast));
        case "static_call":
            // Does not partially evaluate at the moment. Will attempt to fully evaluate
            return makeValueExpression(interpreter.interpretStaticCall(ast));
    }
}
