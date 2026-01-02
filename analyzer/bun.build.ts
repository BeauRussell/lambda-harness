await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "../internal/embedded/analyzer",
	naming: "analyzer.js",
	target: "bun",
	minify: true,
	sourcemap: "none"
});

console.log(" Built analyzer.js");
