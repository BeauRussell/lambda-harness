const winston = require('winston');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: { service: 'simple-cjs' },
	transports: [
		new winston.transports.Console()
	]
});

function main() {
	logger.info("SIMPLE CJS!");
}

main();
