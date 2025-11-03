const express = require('express');
const { requestIdMiddleware } = require('./requestId');
const { ipRateLimiterMiddleware } = require('./middleware/ipRateLimiter');
const { userDailyLimitMiddleware } = require('./middleware/userDailyLimit');

const app = express();
app.use(express.json());
app.use(requestIdMiddleware);

// Anonymous endpoints example
app.post('/auth/login', ipRateLimiterMiddleware(), (req, res) => {
  res.json({ ok: true });
});

app.get('/uploads/presign', ipRateLimiterMiddleware(), (req, res) => {
  res.json({ url: 'https://example.com/presigned' });
});

// Job submission example - expects x-user-id header
app.post('/jobs/submit', userDailyLimitMiddleware(), (req, res) => {
  res.json({ enqueued: true });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on :${port}`);
  });
}

module.exports = { app };
