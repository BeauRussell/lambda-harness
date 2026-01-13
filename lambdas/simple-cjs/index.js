const winston = require('winston');
const got = require('got');

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

	got.get(
		'https://google.com'
	);

	got({
		method: 'POST',
		url: 'httpbig.org',
		body: {
			hello: 'world'
		}
	})
}

main();
