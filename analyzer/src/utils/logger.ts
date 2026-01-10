import winston from 'winston';

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({  level, message, timestamp, stack, ...meta }) => {
	const ts = timestamp as string;
	const msg = String(stack ?? message);
	const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
	return `${ts} [${level.toUpperCase()}]: ${msg}${metaStr}`;
});

export const logger = winston.createLogger({
	level: 'info',
	format: combine(
		errors({ stack: true }),
		timestamp({
			format: 'YYYY-MM-DD HH:mm:ss',
		}),
		logFormat
	),
	transports: [
		new winston.transports.File({
			filename: 'analyzer.log',
			level: 'info',
		}),
	],
});
