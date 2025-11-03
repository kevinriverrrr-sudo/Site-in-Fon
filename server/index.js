const path = require('path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/config');
const logger = require('../src/logger');
const { runWithRequestId, getRequestId } = require('../src/context');
const { captureException, initSentry } = require('../src/sentry');
const { checkHealth } = require('../src/health');

initSentry();

const app = express();
app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware + structured logging of request lifecycle
app.use((req, res, next) => {
  const headerName = config.requestIdHeader.toLowerCase();
  const incomingId = req.headers[headerName];
  const requestId = (Array.isArray(incomingId) ? incomingId[0] : incomingId) || uuidv4();
  const start = process.hrtime.bigint();

  runWithRequestId(requestId, () => {
    res.setHeader(config.requestIdHeader, requestId);
    logger.info('request.start', { method: req.method, path: req.originalUrl });

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info('request.finish', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs)
      });
    });
    next();
  });
});

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    const result = await checkHealth();
    res.status(result.status === 'unhealthy' ? 503 : 200).json({
      ...result,
      requestId: getRequestId()
    });
  } catch (e) {
    logger.error('healthz.error', { error: String(e && e.stack || e) });
    res.status(500).json({ status: 'unhealthy', error: 'health check failure', requestId: getRequestId() });
  }
});

// Example API route + structured response
app.post('/api/echo', (req, res) => {
  logger.info('api.echo', { body: req.body });
  res.json({ data: { echo: req.body || null }, requestId: getRequestId() });
});

app.get('/api/error', () => {
  // This will be handled by error middleware
  throw Object.assign(new Error('Intentional error for testing'), { code: 'TEST_ERROR' });
});

// Serve static UI
app.use('/', express.static(path.join(process.cwd(), 'public')));

// API error handler -> structured JSON + Sentry capture
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  logger.error('api.error', { code, status, error: String(err && err.stack || err) });
  captureException(err, { path: req.originalUrl, method: req.method });
  res.status(status).json({
    error: {
      code,
      message: status === 500 ? 'Internal Server Error' : (err.message || 'Error'),
      details: config.env === 'development' ? (err.stack || String(err)) : undefined
    },
    requestId: getRequestId()
  });
});

app.listen(config.port, () => {
  logger.info('server.started', { port: config.port, env: config.env });
});
