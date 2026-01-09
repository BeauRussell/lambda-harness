const winston = require('winston');

process.env.STANDALONE_TEST;

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: { service: 'simple-cjs' },
	transports: [
		new winston.transports.Console()
	]
});

function main() {
	const set_test = process.env.SET_TEST;
	logger.info("SIMPLE CJS!");
	logger.info(process.env.LOG_TEST);
}

main();
