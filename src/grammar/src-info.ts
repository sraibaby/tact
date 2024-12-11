import { Interval as RawInterval } from "ohm-js";

export type ItemOrigin = "stdlib" | "user";

export interface LineAndColumnInfo {
    // offset: number;
    lineNum: number;
    colNum: number;
    // line: string;
    // prevLine: string;
    // nextLine: string;
    // toString(...ranges: number[][]): string;
}  

export type AbstractInterval = {
    contents: string;
    getLineAndColumnMessage(): string;
    getLineAndColumn(): LineAndColumnInfo;
    startIdx: number;
    endIdx: number;
};

export interface AbstractSrcInfo {
    get file(): string | null;
    get contents(): string;
    get interval(): AbstractInterval;
    get origin(): ItemOrigin;
}

/**
 * Information about source code location (file and interval within it)
 * and the source code contents.
 */
export class SrcInfo implements AbstractSrcInfo {
    readonly #interval: RawInterval;
    readonly #file: string | null;
    readonly #origin: ItemOrigin;

    constructor(
        interval: RawInterval,
        file: string | null,
        origin: ItemOrigin,
    ) {
        this.#interval = interval;
        this.#file = file;
        this.#origin = origin;
    }

    get file() {
        return this.#file;
    }

    get contents() {
        return this.#interval.contents;
    }

    get interval() {
        return this.#interval;
    }

    get origin() {
        return this.#origin;
    }
}