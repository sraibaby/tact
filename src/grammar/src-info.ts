export type ItemOrigin = "stdlib" | "user";

export type LineAndColumnInfo = {
    lineNum: number;
    colNum: number;
    toString(...ranges: number[][]): string;
}  

export type AbstractInterval = {
    contents: string;
    getLineAndColumnMessage(): string;
    getLineAndColumn(): LineAndColumnInfo;
    startIdx: number;
    endIdx: number;
};

export type AbstractSrcInfo = {
    file: string | null;
    contents: string;
    interval: AbstractInterval;
    origin: ItemOrigin;
}

export const dummySrcInfo: AbstractSrcInfo = {
    contents: '',
    file: null,
    interval: {
        contents: '',
        startIdx: 0,
        endIdx: 0,
        getLineAndColumn: () => ({
            colNum: 1,
            lineNum: 1,
            toString: () => {
                throw new Error();
            },
        }),
        getLineAndColumnMessage: () => 'Line 1, col 1:\n> 1 | \n      ^\n',
    },
    origin: 'user',
};