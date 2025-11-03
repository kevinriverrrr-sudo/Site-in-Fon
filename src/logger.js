const config = require('./config');
const { getRequestId } = require('./context');

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const levelIndex = levels.indexOf(config.logLevel);

function serialize(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    // Force serialization of circular or weird values
    return JSON.stringify({ message: String(obj) });
  }
}

function baseLog(level, msg, meta) {
  const idx = levels.indexOf(level);
  if (idx < levelIndex) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    msg: msg || '',
    requestId: getRequestId() || undefined,
  };
  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  const line = config.jsonLogs ? serialize(entry) : `${entry.time} ${level.toUpperCase()} ${entry.requestId ? `[${entry.requestId}] ` : ''}${msg}${meta ? ' ' + serialize(meta) : ''}`;
  if (idx >= levels.indexOf('error')) {
    console.error(line);
  } else {
    console.log(line);
  }
}

const logger = {
  trace: (msg, meta) => baseLog('trace', msg, meta),
  debug: (msg, meta) => baseLog('debug', msg, meta),
  info: (msg, meta) => baseLog('info', msg, meta),
  warn: (msg, meta) => baseLog('warn', msg, meta),
  error: (msg, meta) => baseLog('error', msg, meta),
  fatal: (msg, meta) => baseLog('fatal', msg, meta)
};

module.exports = logger;
