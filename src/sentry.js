const config = require('./config');
const logger = require('./logger');

let sentry = null;
let initialized = false;

function initSentry() {
  if (initialized) return;
  initialized = true;
  if (!config.sentry.enabled) {
    logger.debug('Sentry disabled by config');
    return;
  }
  if (!config.sentry.dsn) {
    logger.warn('Sentry enabled but DSN is not set');
    return;
  }
  try {
    // Optional dependency - only load if available
    // eslint-disable-next-line global-require
    sentry = require('@sentry/node');
    sentry.init({
      dsn: config.sentry.dsn,
      environment: config.env,
      tracesSampleRate: config.sentry.tracesSampleRate || 0
    });
    logger.info('Sentry initialized');
  } catch (e) {
    sentry = null;
    logger.warn('Sentry SDK not installed; running with no-op instrumentation');
  }
}

function captureException(err, context) {
  if (!initialized) initSentry();
  if (sentry && typeof sentry.captureException === 'function') {
    sentry.captureException(err, { extra: context || {} });
  } else {
    logger.error('captureException', { error: String(err && err.stack || err), context });
  }
}

module.exports = { initSentry, captureException };
