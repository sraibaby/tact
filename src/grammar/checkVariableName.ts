import { throwCompilationError } from "../errors";
import { AbstractSrcInfo } from "./src-info";

export function checkVariableName(name: string, loc: AbstractSrcInfo) {
    if (name.startsWith("__gen")) {
        throwCompilationError(`Variable name cannot start with "__gen"`, loc);
    }
    if (name.startsWith("__tact")) {
        throwCompilationError(`Variable name cannot start with "__tact"`, loc);
    }
}
