require('dotenv').config();
const express = require('express');
const { env } = require('./env');

const app = express();
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'App is running',
    env: {
      nodeEnv: env.NODE_ENV,
      appUrl: env.APP_URL,
      billingEnabled: env.FEATURE_BILLING_ENABLED,
      queueProvider: env.QUEUE_PROVIDER,
      workerConcurrency: env.WORKER_CONCURRENCY
    }
  });
});

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
