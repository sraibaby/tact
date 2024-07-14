/**
 * The supported version of the Func compiler:
 * https://github.com/ton-blockchain/ton/blob/6897b5624566a2ab9126596d8bc4980dfbcaff2d/crypto/func/func.h#L48
 */
export const FUNC_VERSION: string = "0.4.4";

/**
 * Represents an ordered collection of values.
 * NOTE: Unit type `()` is a special case of the tensor type.
 */
export type FuncTensorType = FuncType[];
export const UNIT_TYPE: FuncType = {
    kind: "tensor",
    value: [] as FuncTensorType,
};

/**
 * Type annotations available within the syntax tree.
 */
export type FuncType =
    | { kind: "int" }
    | { kind: "cell" }
    | { kind: "slice" }
    | { kind: "builder" }
    | { kind: "cont" }
    | { kind: "tuple" }
    | { kind: "tensor"; value: FuncTensorType }
    | { kind: "type" };

export type FuncAstUnaryOp = "-" | "~" | "+";

export type FuncAstBinaryOp =
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "<"
    | ">"
    | "&"
    | "|"
    | "^"
    | "=="
    | "!="
    | "<="
    | ">="
    | "<=>"
    | "<<"
    | ">>"
    | "~>>"
    | "^>>"
    | "~/"
    | "^/"
    | "~%"
    | "^%"
    | "/%";

export type FuncAstAugmentedAssignOp =
    | "+="
    | "-="
    | "*="
    | "/="
    | "~/="
    | "^/="
    | "%="
    | "~%="
    | "^%="
    | "<<="
    | ">>="
    | "~>>="
    | "^>>="
    | "&="
    | "|="
    | "^=";

export type FuncAstTmpVarClass = "In" | "Named" | "Tmp" | "UniqueName";

interface FuncAstVarDescrFlags {
    Last: boolean;
    Unused: boolean;
    Const: boolean;
    Int: boolean;
    Zero: boolean;
    NonZero: boolean;
    Pos: boolean;
    Neg: boolean;
    Bool: boolean;
    Bit: boolean;
    Finite: boolean;
    Nan: boolean;
    Even: boolean;
    Odd: boolean;
    Null: boolean;
    NotNull: boolean;
}

export type FuncAstConstant = {
    kind: "constant";
    ty: FuncType;
    init: FuncAstExpr;
};

export type FuncAstIdExpr = {
    kind: "id_expr";
    value: string;
};

export type FuncAstCallExpr = {
    kind: "call_expr";
    fun: FuncAstExpr;
    args: FuncAstExpr[];
};

export type FuncAstAssignExpr = {
    kind: "assign_expr";
    lhs: FuncAstExpr;
    rhs: FuncAstExpr;
};

// Augmented assignment: a += 42;
export type FuncAstAugmentedAssignExpr = {
    kind: "augmented_assign_expr";
    lhs: FuncAstExpr;
    op: FuncAstAugmentedAssignOp;
    rhs: FuncAstExpr;
};

export type FuncAstTernaryExpr = {
    kind: "ternary_expr";
    cond: FuncAstExpr;
    trueExpr: FuncAstExpr;
    falseExpr: FuncAstExpr;
};

export type FuncAstBinaryExpr = {
    kind: "binary_expr";
    lhs: FuncAstExpr;
    op: FuncAstBinaryOp;
    rhs: FuncAstExpr;
};

export type FuncAstUnaryExpr = {
    kind: "unary_expr";
    op: FuncAstUnaryOp;
    value: FuncAstExpr;
};

export type FuncAstNumberExpr = {
    kind: "number_expr";
    value: bigint;
};

export type FuncAstBoolExpr = {
    kind: "bool_expr";
    value: boolean;
};

export type FuncAstStringExpr = {
    kind: "string_expr";
    value: string;
};

export type FuncAstNilExpr = {
    kind: "nil_expr";
};

export type FuncAstApplyExpr = {
    kind: "apply_expr";
    lhs: FuncAstExpr;
    rhs: FuncAstExpr;
};

export type FuncAstTupleExpr = {
    kind: "tuple_expr";
    values: FuncAstExpr[];
};

export type FuncAstTensorExpr = {
    kind: "tensor_expr";
    values: FuncAstExpr[];
};

export type FuncAstUnitExpr = {
    kind: "unit_expr";
};

// Defines a variable applying the local type inference rules:
// var x = 2;
// _ = 2;
export type FuncAstHoleExpr = {
    kind: "hole_expr";
    id: string | undefined;
    init: FuncAstExpr;
};

// Primitive types are used in the syntax tree to express polymorphism.
export type FuncAstPrimitiveTypeExpr = {
    kind: "primitive_type_expr";
    ty: FuncType;
};

// Local variable definition:
// int x = 2; // ty = int
// var x = 2; // ty is undefined
export type FuncAstVarDefStmt = {
    kind: "var_def_stmt";
    name: string;
    ty: FuncType | undefined;
    init: FuncAstExpr | undefined;
};

export type FuncAstReturnStmt = {
    kind: "return_stmt";
    value: FuncAstExpr | undefined;
};

export type FuncAstBlockStmt = {
    kind: "block_stmt";
    body: FuncAstStmt[];
};

export type FuncAstRepeatStmt = {
    kind: "repeat_stmt";
    condition: FuncAstExpr;
    body: FuncAstStmt[];
};

export type FuncAstConditionStmt = {
    kind: "condition_stmt";
    condition?: FuncAstExpr;
    ifnot: boolean; // negation: ifnot or elseifnot attribute
    body: FuncAstStmt[];
    else?: FuncAstConditionStmt;
};

export type FuncAstDoUntilStmt = {
    kind: "do_until_stmt";
    body: FuncAstStmt[];
    condition: FuncAstExpr;
};

export type FuncAstWhileStmt = {
    kind: "while_stmt";
    condition: FuncAstExpr;
    body: FuncAstStmt[];
};

export type FuncAstExprStmt = {
    kind: "expr_stmt";
    expr: FuncAstExpr;
};

export type FuncAstTryCatchStmt = {
    kind: "try_catch_stmt";
    tryBlock: FuncAstStmt[];
    catchBlock: FuncAstStmt[];
    catchVar: string | null;
};

export type FuncAstFunctionAttribute = "impure" | "inline";

export type FuncAstFormalFunctionParam = {
    kind: "function_param";
    name: string;
    ty: FuncType;
};

export type FuncAstFunction = {
    kind: "function";
    name: string,
    attrs: FuncAstFunctionAttribute[];
    params: FuncAstFormalFunctionParam[];
    returnTy: FuncType;
    body: FuncAstStmt[];
};

export type FuncAstComment = {
    kind: "comment";
    values: string[]; // Represents multiline comments
};

export type FuncAstInclude = {
    kind: "include";
};

export type FuncAstPragma = {
    kind: "pragma";
};

export type FuncAstGlobalVariable = {
    kind: "global_variable";
    name: string;
    ty: FuncType;
};

export type FuncAstModuleEntry =
    | FuncAstInclude
    | FuncAstPragma
    | FuncAstFunction
    | FuncAstComment
    | FuncAstConstant
    | FuncAstGlobalVariable;

export type FuncAstModule = {
    kind: "module";
    entries: FuncAstModuleEntry[];
};

export type FuncAstLiteralExpr =
    | FuncAstNumberExpr
    | FuncAstBoolExpr
    | FuncAstStringExpr
    | FuncAstNilExpr;
export type FuncAstSimpleExpr =
    | FuncAstIdExpr
    | FuncAstTupleExpr
    | FuncAstTensorExpr
    | FuncAstUnitExpr
    | FuncAstHoleExpr
    | FuncAstPrimitiveTypeExpr;
export type FuncAstCompositeExpr =
    | FuncAstCallExpr
    | FuncAstAssignExpr
    | FuncAstAugmentedAssignExpr
    | FuncAstTernaryExpr
    | FuncAstBinaryExpr
    | FuncAstUnaryExpr
    | FuncAstApplyExpr;
export type FuncAstExpr =
    | FuncAstLiteralExpr
    | FuncAstSimpleExpr
    | FuncAstCompositeExpr;

export type FuncAstStmt =
    | FuncAstBlockStmt
    | FuncAstVarDefStmt
    | FuncAstReturnStmt
    | FuncAstRepeatStmt
    | FuncAstConditionStmt
    | FuncAstDoUntilStmt
    | FuncAstWhileStmt
    | FuncAstExprStmt
    | FuncAstTryCatchStmt;

export type FuncAstNode =
    | FuncAstStmt
    | FuncAstExpr
    | FuncAstModule
    | FuncAstModuleEntry
    | FuncType;
