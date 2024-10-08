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
    InterpreterConfig,
    ensureInt,
    evalBinaryOp,
    evalUnaryOp,
    throwNonFatalErrorConstEval,
} from "./interpreter";

// Utility Exception class to interrupt the execution
// of functions that cannot evaluate a tree fully into a value.
class PartiallyEvaluatedTree extends Error {
    public tree: AstExpression;

    constructor(tree: AstExpression) {
        super();
        this.tree = tree;
    }
}

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
        return makeValueExpression(
            ensureInt(
                -operand.value,
                source,
                interpreter.config.checkValueBoundsInExpressions,
            ),
        );
    }

    const simplOperand = partiallyEvalExpression_(operand, ctx, interpreter);

    if (isValue(simplOperand)) {
        const valueOperand = extractValue(simplOperand as AstValue);
        const result = evalUnaryOp(
            op,
            valueOperand,
            interpreter.config.checkValueBoundsInExpressions,
            simplOperand.loc,
            source,
        );
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
    const leftOperand = partiallyEvalExpression(left, ctx);

    if (isValue(leftOperand)) {
        // Because of short-circuiting, we must delay evaluation of the right operand
        const valueLeftOperand = extractValue(leftOperand as AstValue);

        try {
            const result = evalBinaryOp(
                op,
                valueLeftOperand,
                // We delay the evaluation of the right operand inside a continuation
                () => {
                    const rightOperand = partiallyEvalExpression(right, ctx);
                    if (isValue(rightOperand)) {
                        // If the right operand reduces to a value, then we can let the function
                        // evalBinaryOp finish its normal execution by returning the value
                        // in the right operand.
                        return extractValue(rightOperand as AstValue);
                    } else {
                        // If the right operand does not reduce to a value,
                        // we interrupt the execution of the evalBinaryOp function
                        // by returning an exception with the partially evaluated right operand.
                        // The simplification rules will handle the partially evaluated tree in the catch
                        // of the try surrounding the evalBinaryOp function.
                        throw new PartiallyEvaluatedTree(rightOperand);
                    }
                },
                interpreter.config.checkValueBoundsInExpressions,
                leftOperand.loc,
                right.loc,
                source,
            );

            return makeValueExpression(result);
        } catch (e) {
            if (e instanceof PartiallyEvaluatedTree) {
                // The right operand did not evaluate to a value. Hence,
                // time to symbolically simplify the full tree.
                const newAst = makeBinaryExpression(op, leftOperand, e.tree);
                return optimizer.applyRules(newAst);
            } else {
                throw e;
            }
        }
    } else {
        // Since the left operand does not reduce to a value, no immediate short-circuiting will occur.
        // Hence, we can partially evaluate the right operand and let the rules
        // simplify the tree.
        const rightOperand = partiallyEvalExpression(right, ctx);
        const newAst = makeBinaryExpression(op, leftOperand, rightOperand);
        return optimizer.applyRules(newAst);
    }
}

function ensureValueBounds(
    val: Value,
    source: SrcInfo,
    boundCheck: boolean,
): Value {
    if (typeof val === "bigint") {
        return ensureInt(val, source, boundCheck);
    } else if (
        val !== null &&
        typeof val === "object" &&
        "$tactStruct" in val
    ) {
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
    interpreterConfig?: InterpreterConfig,
): Value {
    let config = {
        ...defaultInterpreterConfig,
        checkValueBoundsInExpressions: false,
    };

    if (interpreterConfig) {
        config = { ...interpreterConfig, checkValueBoundsInExpressions: false };
    }
    const interpreter = new Interpreter(ctx, config);
    const result = interpreter.interpretExpression(ast);

    // But we need to check the bounds in the final value.
    return ensureValueBounds(
        result,
        ast.loc,
        interpreter.config.checkValueBoundsInExpressions,
    );
}

export function partiallyEvalExpression(
    ast: AstExpression,
    ctx: CompilerContext,
    interpreterConfig?: InterpreterConfig,
): AstExpression {
    // For the partial evaluator, bounding checking is trickier.

    // If evaluation actually results in a single value, then we just need to check the bounds at the end.
    // But if evaluation fails to return a single value, we must carry out partial evaluation with
    // bound checking activated, because the partial expression will be part of the final program!

    // Hence, we need to make two evaluation passes to the expression.

    // First pass: attempt to fully evaluate with bound checking deactivated.

    let config = {
        ...defaultInterpreterConfig,
        checkValueBoundsInExpressions: false,
    };

    if (interpreterConfig) {
        config = { ...interpreterConfig, checkValueBoundsInExpressions: false };
    }

    try {
        const interpreter = new Interpreter(ctx, config);
        const result = interpreter.interpretExpression(ast);

        // Then, check the bounds in the end
        return makeValueExpression(
            ensureValueBounds(
                result,
                ast.loc,
                interpreter.config.checkValueBoundsInExpressions,
            ),
        );
    } catch (e) {
        if (e instanceof TactConstEvalError) {
            if (!e.fatal) {
                // If a non-fatal error occurs, the second pass should be attempted
                // (this time carrying out partial evaluation), but with bound checking activated.

                config = { ...config, checkValueBoundsInExpressions: true };

                const interpreter = new Interpreter(ctx, config);

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
            return partiallyEvalUnaryOp(
                ast.op,
                ast.operand,
                ast.loc,
                ctx,
                interpreter,
            );
        case "op_binary":
            return partiallyEvalBinaryOp(
                ast.op,
                ast.left,
                ast.right,
                ast.loc,
                ctx,
                interpreter,
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
