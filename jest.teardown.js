const coverage = require("@tact-lang/coverage");
const path = require("path");

module.exports = async () => {
    if (process.env.COVERAGE === "true") {
        coverage.completeCoverage([
            path.resolve(__dirname, "examples", "output", "*.boc"),
            path.resolve(
                __dirname,
                "test",
                "codegen",
                "output",
                "*.boc",
            ),
            path.resolve(
                __dirname,
                "test",
                "e2e-emulated",
                "output",
                "*.boc",
            ),
            path.resolve(
                __dirname,
                "benchmarks",
                "contracts",
                "output",
                "*.boc",
            ),
        ]);
    }
};
