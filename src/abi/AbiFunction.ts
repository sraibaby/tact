import { AstExpression } from "../grammar/ast";
import { CompilerContext } from "../context";
import { WriterContext } from "../generator/Writer";
import { TypeRef } from "../types/types";
import { AbstractSrcInfo } from "../grammar/src-info";

export type AbiFunction = {
    name: string;
    resolve: (ctx: CompilerContext, args: TypeRef[], loc: AbstractSrcInfo) => TypeRef;
    generate: (
        ctx: WriterContext,
        args: TypeRef[],
        resolved: AstExpression[],
        loc: AbstractSrcInfo,
    ) => string;
};
