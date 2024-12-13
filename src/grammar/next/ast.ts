/**
 * AST node constructors are not just constructors: they also generate ids
 * We have this file so that the "current id" state would not be stored globally
 */

import { Location } from "@langtools/pgen/runtime";
import * as A from "../ast";
import { AbstractSrcInfo } from "../src-info";

export const getAstSchema = (
    toSrcInfo: (location: Location) => AbstractSrcInfo,
    nextId: number = 1,
) => {
    const createAstNode = <T>(src: Omit<T, "id">): T => {
        return Object.freeze(Object.assign({ id: nextId++ }, src)) as T;
    };

    const cloneAstNode = <T extends { id: number }>(src: T): T => {
        return { ...src, id: nextId++ };
    };

    const constructors = {
        Module: (imports: A.AstImport[], items: A.AstModuleItem[]): A.AstModule => createAstNode<A.AstModule>({ kind: "module", imports, items, }),
        Import: (path: A.AstString, loc: Location): A.AstImport => createAstNode<A.AstImport>({ kind: "import", path, loc: toSrcInfo(loc), }),
        PrimitiveTypeDecl: (name: A.AstId, loc: Location): A.AstPrimitiveTypeDecl => createAstNode<A.AstPrimitiveTypeDecl>({ kind: "primitive_type_decl", name, loc: toSrcInfo(loc), }),
        FunctionDef: (attributes: A.AstFunctionAttribute[], name: A.AstId, retType: A.AstType | null, params: A.AstTypedParameter[], statements: A.AstStatement[], loc: Location): A.AstFunctionDef => createAstNode<A.AstFunctionDef>({ kind: "function_def", attributes, name, return: retType, params, statements, loc: toSrcInfo(loc), }),
        AsmFunctionDef: (shuffle: A.AstAsmShuffle, attributes: A.AstFunctionAttribute[], name: A.AstId, retType: A.AstType | null, params: A.AstTypedParameter[], instructions: readonly A.AstAsmInstruction[], loc: Location): A.AstAsmFunctionDef => createAstNode<A.AstAsmFunctionDef>({ kind: "asm_function_def", shuffle, attributes, name, return: retType, params, instructions, loc: toSrcInfo(loc), }),
        FunctionDecl: (attributes: A.AstFunctionAttribute[], name: A.AstId, retType: A.AstType | null, params: A.AstTypedParameter[], loc: Location): A.AstFunctionDecl => createAstNode<A.AstFunctionDecl>({ kind: "function_decl", attributes, name, return: retType, params, loc: toSrcInfo(loc), }),
        NativeFunctionDecl: (attributes: A.AstFunctionAttribute[], name: A.AstId, nativeName: A.AstFuncId, params: A.AstTypedParameter[], retType: A.AstType | null, loc: Location): A.AstNativeFunctionDecl => createAstNode<A.AstNativeFunctionDecl>({ kind: "native_function_decl", attributes, name, nativeName, params, return: retType, loc: toSrcInfo(loc), }),
        ConstantDef: (attributes: A.AstConstantAttribute[], name: A.AstId, type: A.AstType, initializer: A.AstExpression, loc: Location): A.AstConstantDef => createAstNode<A.AstConstantDef>({ kind: "constant_def", attributes, name, type, initializer, loc: toSrcInfo(loc), }),
        ConstantDecl: (attributes: A.AstConstantAttribute[], name: A.AstId, type: A.AstType, loc: Location): A.AstConstantDecl => createAstNode<A.AstConstantDecl>({ kind: "constant_decl", attributes, name, type, loc: toSrcInfo(loc), }),
        StructDecl: (name: A.AstId, fields: A.AstFieldDecl[], loc: Location): A.AstStructDecl => createAstNode<A.AstStructDecl>({ kind: "struct_decl", name, fields, loc: toSrcInfo(loc), }),
        MessageDecl: (name: A.AstId, opcode: A.AstNumber | null, fields: A.AstFieldDecl[], loc: Location): A.AstMessageDecl => createAstNode<A.AstMessageDecl>({ kind: "message_decl", name, opcode, fields, loc: toSrcInfo(loc), }),
        Contract: (name: A.AstId, traits: A.AstId[], attributes: A.AstContractAttribute[], declarations: A.AstContractDeclaration[], loc: Location): A.AstContract => createAstNode<A.AstContract>({ kind: "contract", name, traits, attributes, declarations, loc: toSrcInfo(loc), }),
        Trait: (name: A.AstId, traits: A.AstId[], attributes: A.AstContractAttribute[], declarations: A.AstTraitDeclaration[], loc: Location): A.AstTrait => createAstNode<A.AstTrait>({ kind: "trait", name, traits, attributes, declarations, loc: toSrcInfo(loc), }),
        FieldDecl: (name: A.AstId, type: A.AstType, initializer: A.AstExpression | null, as: A.AstId | null, loc: Location): A.AstFieldDecl => createAstNode<A.AstFieldDecl>({ kind: "field_decl", name, type, initializer, as, loc: toSrcInfo(loc), }),
        Receiver: (selector: A.AstReceiverKind, statements: A.AstStatement[], loc: Location): A.AstReceiver => createAstNode<A.AstReceiver>({ kind: "receiver", selector, statements, loc: toSrcInfo(loc), }),
        ContractInit: (params: A.AstTypedParameter[], statements: A.AstStatement[], loc: Location): A.AstContractInit => createAstNode<A.AstContractInit>({ kind: "contract_init", params, statements, loc: toSrcInfo(loc), }),
        StatementLet: (name: A.AstId, type: A.AstType | null, expression: A.AstExpression, loc: Location): A.AstStatementLet => createAstNode<A.AstStatementLet>({ kind: "statement_let", name, type, expression, loc: toSrcInfo(loc), }),
        StatementReturn: (expression: A.AstExpression | null, loc: Location): A.AstStatementReturn => createAstNode<A.AstStatementReturn>({ kind: "statement_return", expression, loc: toSrcInfo(loc), }),
        StatementExpression: (expression: A.AstExpression, loc: Location): A.AstStatementExpression => createAstNode<A.AstStatementExpression>({ kind: "statement_expression", expression, loc: toSrcInfo(loc), }),
        StatementAssign: (path: A.AstExpression, expression: A.AstExpression, loc: Location): A.AstStatementAssign => createAstNode<A.AstStatementAssign>({ kind: "statement_assign", path, expression, loc: toSrcInfo(loc), }),
        StatementAugmentedAssign: (op: A.AstAugmentedAssignOperation, path: A.AstExpression, expression: A.AstExpression, loc: Location): A.AstStatementAugmentedAssign => createAstNode<A.AstStatementAugmentedAssign>({ kind: "statement_augmentedassign", op, path, expression, loc: toSrcInfo(loc), }),
        Condition: (condition: A.AstExpression, trueStatements: A.AstStatement[], falseStatements: A.AstStatement[] | null, elseif: A.AstCondition | null, loc: Location): A.AstCondition => createAstNode<A.AstCondition>({ kind: "statement_condition", condition, trueStatements, falseStatements, elseif, loc: toSrcInfo(loc), }),
        StatementWhile: (condition: A.AstExpression, statements: A.AstStatement[], loc: Location): A.AstStatementWhile => createAstNode<A.AstStatementWhile>({ kind: "statement_while", condition, statements, loc: toSrcInfo(loc), }),
        StatementUntil: (condition: A.AstExpression, statements: A.AstStatement[], loc: Location): A.AstStatementUntil => createAstNode<A.AstStatementUntil>({ kind: "statement_until", condition, statements, loc: toSrcInfo(loc), }),
        StatementRepeat: (iterations: A.AstExpression, statements: A.AstStatement[], loc: Location): A.AstStatementRepeat => createAstNode<A.AstStatementRepeat>({ kind: "statement_repeat", iterations, statements, loc: toSrcInfo(loc), }),
        StatementTry: (statements: A.AstStatement[], loc: Location): A.AstStatementTry => createAstNode<A.AstStatementTry>({ kind: "statement_try", statements, loc: toSrcInfo(loc), }),
        StatementTryCatch: (statements: A.AstStatement[], catchName: A.AstId, catchStatements: A.AstStatement[], loc: Location): A.AstStatementTryCatch => createAstNode<A.AstStatementTryCatch>({ kind: "statement_try_catch", statements, catchName, catchStatements, loc: toSrcInfo(loc), }),
        StatementForEach: (keyName: A.AstId, valueName: A.AstId, map: A.AstExpression, statements: A.AstStatement[], loc: Location): A.AstStatementForEach => createAstNode<A.AstStatementForEach>({ kind: "statement_foreach", keyName, valueName, map, statements, loc: toSrcInfo(loc), }),
        TypeId: (text: string, loc: Location): A.AstTypeId => createAstNode<A.AstTypeId>({ kind: "type_id", text, loc: toSrcInfo(loc), }),
        OptionalType: (typeArg: A.AstType, loc: Location): A.AstOptionalType => createAstNode<A.AstOptionalType>({ kind: "optional_type", typeArg, loc: toSrcInfo(loc), }),
        MapType: (keyType: A.AstTypeId, keyStorageType: A.AstId | null, valueType: A.AstTypeId, valueStorageType: A.AstId | null, loc: Location): A.AstMapType => createAstNode<A.AstMapType>({ kind: "map_type", keyType, keyStorageType, valueType, valueStorageType, loc: toSrcInfo(loc), }),
        BouncedMessageType: (messageType: A.AstTypeId, loc: Location): A.AstBouncedMessageType => createAstNode<A.AstBouncedMessageType>({ kind: "bounced_message_type", messageType, loc: toSrcInfo(loc), }),
        OpBinary: (op: A.AstBinaryOperation, left: A.AstExpression, right: A.AstExpression, loc: Location): A.AstOpBinary => createAstNode<A.AstOpBinary>({ kind: "op_binary", op, left, right, loc: toSrcInfo(loc), }),
        OpUnary: (op: A.AstUnaryOperation, operand: A.AstExpression, loc: Location): A.AstOpUnary => createAstNode<A.AstOpUnary>({ kind: "op_unary", op, operand, loc: toSrcInfo(loc), }),
        FieldAccess: (aggregate: A.AstExpression, field: A.AstId, loc: Location): A.AstFieldAccess => createAstNode<A.AstFieldAccess>({ kind: "field_access", aggregate, field, loc: toSrcInfo(loc), }),
        MethodCall: (self: A.AstExpression, method: A.AstId, args: A.AstExpression[], loc: Location): A.AstMethodCall => createAstNode<A.AstMethodCall>({ kind: "method_call", self, method, args, loc: toSrcInfo(loc), }),
        StaticCall: (funcId: A.AstId, args: A.AstExpression[], loc: Location): A.AstStaticCall => createAstNode<A.AstStaticCall>({ kind: "static_call", function: funcId, args, loc: toSrcInfo(loc), }),
        StructInstance: (type: A.AstId, args: A.AstStructFieldInitializer[], loc: Location): A.AstStructInstance => createAstNode<A.AstStructInstance>({ kind: "struct_instance", type, args, loc: toSrcInfo(loc), }),
        StructFieldInitializer: (field: A.AstId, initializer: A.AstExpression, loc: Location): A.AstStructFieldInitializer => createAstNode<A.AstStructFieldInitializer>({ kind: "struct_field_initializer", field, initializer, loc: toSrcInfo(loc), }),
        InitOf: (contract: A.AstId, args: A.AstExpression[], loc: Location): A.AstInitOf => createAstNode<A.AstInitOf>({ kind: "init_of", contract, args, loc: toSrcInfo(loc), }),
        Conditional: (condition: A.AstExpression, thenBranch: A.AstExpression, elseBranch: A.AstExpression, loc: Location): A.AstConditional => createAstNode<A.AstConditional>({ kind: "conditional", condition, thenBranch, elseBranch, loc: toSrcInfo(loc), }),
        Id: (text: string, loc: Location): A.AstId => createAstNode<A.AstId>({ kind: "id", text, loc: toSrcInfo(loc), }),
        FuncId: (text: string, loc: Location): A.AstFuncId => createAstNode<A.AstFuncId>({ kind: "func_id", text, loc: toSrcInfo(loc), }),
        Null: (loc: Location): A.AstNull => createAstNode<A.AstNull>({ kind: "null", loc: toSrcInfo(loc), }),
        String: (value: string, loc: Location): A.AstString => createAstNode<A.AstString>({ kind: "string", value, loc: toSrcInfo(loc), }),
        Boolean: (value: boolean, loc: Location): A.AstBoolean => createAstNode<A.AstBoolean>({ kind: "boolean", value, loc: toSrcInfo(loc), }),
        Number: (base: A.AstNumberBase, value: bigint, loc: Location): A.AstNumber => createAstNode<A.AstNumber>({ kind: "number", base, value, loc: toSrcInfo(loc), }),
        ContractAttribute: (name: A.AstString, loc: Location): A.AstContractAttribute => createAstNode<A.AstContractAttribute>({ type: "interface", name, loc: toSrcInfo(loc), }),
        FunctionAttribute: (type: A.AstFunctionAttributeName, loc: Location): A.AstFunctionAttribute => ({ type, loc: toSrcInfo(loc), }),
        ConstantAttribute: (type: A.AstConstantAttributeName, loc: Location): A.AstConstantAttribute => ({ type, loc: toSrcInfo(loc), }),
        TypedParameter: (name: A.AstId, type: A.AstType, loc: Location): A.AstTypedParameter => createAstNode<A.AstTypedParameter>({ kind: "typed_parameter", name, type, loc: toSrcInfo(loc), }),
    };

    return {
        cloneAstNode,
        constructors,
    };
};

/**
 * List of all constructors for AST nodes
 */
export type AstSchema = ReturnType<typeof getAstSchema>["constructors"];