// @bun
import{parseArgs as s}from"util";var{positionals:r}=s({args:Bun.argv,strict:!0,allowPositionals:!0});function i(o){if(!o)console.error("No path passed into Analyzer"),process.exit(1);console.log(o),process.exit(0)}i(r[2]);
