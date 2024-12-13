import * as $ from '@langtools/pgen/runtime';
import * as G from './grammar';
import * as A from "../ast";
import { parseModule } from './semantics';
import { getAstSchema } from './ast';
import { getErrorSchema } from './errors';
import { AbstractSrcInfo, ItemOrigin } from '../src-info';

const throwParseError = (
    matchResult: MatchResult,
    path: string,
    origin: ItemOrigin,
): never => {
    const interval = matchResult.getInterval();
    const source = new SrcInfo(interval, path, origin);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = `Parse error: expected ${(matchResult as any).getExpectedText()}\n`;
    throw new TactParseError(
        `${locationStr(source)}${message}\n${interval.getLineAndColumnMessage()}`,
        source,
    );
}

const getSrcInfo = (path: string, origin: ItemOrigin) => {
    return (location: $.Location): AbstractSrcInfo => {
        
    };
};

export const getParser = () => {
    const parse = (
        src: string,
        path: string,
        origin: ItemOrigin,
    ): A.AstModule => {
        try {
            const toSrcInfo = getSrcInfo(path, origin);
            const astSchema = getAstSchema(toSrcInfo);
            const errorSchema = getErrorSchema();
            const context = {
                ast: astSchema.constructors,
                err: errorSchema.constructors,
            };
            const result = parseModule($.parse(G.Module, src))(context);
            const errors = errorSchema.reportedErrors;
            if (errors.length !== 0) {
                // TODO
            }
            return result;
        } catch (e) {
            if (e instanceof $.ParseError) {
                throwParseError(matchResult, path, origin);
            } else {
                throw e;
            }
        }
    }

    const parseExpression = (sourceCode: string): A.AstExpression => {
        const matchResult = tactGrammar.match(sourceCode, "Expression");
        if (matchResult.failed()) {
            throwParseError(matchResult, "", "user");
        }
        ctx = { origin: "user" };
        return semantics(matchResult).astOfExpression();
    };

    const parseImports = (
        src: string,
        path: string,
        origin: ItemOrigin,
    ): string[] => {
        return inFile(path, () => {
            return imports.children.map((item) => item.astOfImport());

            const matchResult = tactGrammar.match(src, "JustImports");
            if (matchResult.failed()) {
                throwParseError(matchResult, path, origin);
            }
            ctx = { origin };
            try {
                const imports: A.AstImport[] =
                    semantics(matchResult).astOfJustImports();
                return imports.map((imp) => imp.path.value);
            } finally {
                ctx = null;
            }
        });
    }

    return {
        parse,
        parseExpression,
        parseImports,
    };
};