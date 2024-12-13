/*
We have this layer so that
- in tests we can rely on contents of error message instead of its text
- error messages can be translated in other languages
*/

import * as $ from '@langtools/runtime';

export type UntypedError = {
    readonly text: string;
    readonly location: $.Location;
};

export const getErrorSchema = () => {
    const reportedErrors: UntypedError[] = [];

    const err = (text: string, location: $.Location): void => {
        reportedErrors.push({ text, location });
    };

    const constructors = {
        notCallable: (loc: $.Location) => {
            err(`Expression is not callable`, loc);
        },
        noGenVariable: (loc: $.Location) => {
            err(`Variable name cannot start with "__gen"`, loc);
        },
        noTactVariable: (loc: $.Location) => {
            err(`Variable name cannot start with "__tact"`, loc);
        },
        noDuplicateFunctionAttribute: (attr: string, loc: $.Location) => {
            err(`Duplicate function attribute "${attr}"`, loc);
        },
        mustBeAbstractFunction: (loc: $.Location) => {
            err(`Abstract function doesn't have abstract modifier`, loc);
        },
        cantBeAbstractFunction: (loc: $.Location) => {
            err(`Non abstract function have abstract modifier`, loc);
        },
        noDuplicateConstantAttribute: (attr: string, loc: $.Location) => {
            err(`Duplicate constant attribute "${attr}"`, loc);
        },
        mustBeAbstractConstant: (loc: $.Location) => {
            err(`Abstract constant doesn't have abstract modifier`, loc);
        },
        cantBeAbstractConstant: (loc: $.Location) => {
            err(`Non-abstract constant has abstract modifier`, loc);
        },
        noBouncedWithoutArg: (loc: $.Location) => {
            err('bounced() cannot be used as fallback', loc);
        },
        noBouncedWithString: (loc: $.Location) => {
            err('bounced() cannot be used with a string literal name', loc);
        },
        noModuleConstantAttributes: (loc: $.Location) => {
            err(`Module-level constants do not support attributes`, loc);
        },
        noConstantDecl: (loc: $.Location) => {
            err(`Variable definition requires an initializer`, loc);
        },
        noFunctionDecl: (loc: $.Location) => {
            err(`Only full function defintions are allowed here`, loc);
        },
        noBackslashInImport: (loc: $.Location) => {
            err(`Import path can't contain "\\"`, loc);
        },
    };

    // Exported in this way to disallow mutation externally
    const reported: readonly UntypedError[] = reportedErrors;

    return {
        constructors,
        reportedErrors: reported,
    };
};

/**
 * List of all constructors for semantic errors
 */
export type ErrorSchema = ReturnType<typeof getErrorSchema>["constructors"];
