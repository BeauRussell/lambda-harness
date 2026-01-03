import { parseArgs } from "util";

const { positionals } = parseArgs({
	args: Bun.argv,
	strict: true,
	allowPositionals: true,
});

function main(path: string | undefined): void {
	if (!path) {
		console.error("No path passed into Analyzer");
		process.exit(1);
	}

	console.log(path);
	process.exit(0);
}

main(positionals[2]);
