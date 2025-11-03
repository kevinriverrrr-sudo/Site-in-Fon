const net = require('net');
const https = require('https');
const { URL } = require('url');
const config = require('./config');

function timeoutPromise(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

function tcpCheck({ host, port }, timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!host || !port) return resolve({ status: 'skipped', details: 'host/port not configured' });

    const socket = new net.Socket();
    let done = false;

    const onDone = (status, details) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch (_) {}
      resolve({ status, details });
    };

    socket.setTimeout(timeoutMs);
    socket.once('error', (err) => onDone('unhealthy', String(err.message || err)));
    socket.once('timeout', () => onDone('unhealthy', 'connection timeout'));
    socket.connect(port, host, () => onDone('ok', `connected to ${host}:${port}`));
  });
}

function parseHostPortFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return { host: u.hostname, port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80) };
  } catch (_) {
    return { host: '', port: undefined };
  }
}

async function checkDbConnectivity() {
  let host = config.health.db.host;
  let port = config.health.db.port;
  if ((!host || !port) && config.health.db.url) {
    const hp = parseHostPortFromUrl(config.health.db.url);
    host = host || hp.host;
    port = port || hp.port;
  }
  if (!host || !port) return { status: 'skipped', details: 'DB connection not configured' };
  return tcpCheck({ host, port });
}

async function checkRedisConnectivity() {
  let host = config.health.redis.host;
  let port = config.health.redis.port || 6379;
  if ((!host || !port) && config.health.redis.url) {
    const hp = parseHostPortFromUrl(config.health.redis.url);
    host = host || hp.host;
    port = port || hp.port || 6379;
  }
  if (!host || !port) return { status: 'skipped', details: 'Redis connection not configured' };
  return tcpCheck({ host, port });
}

async function checkS3Connectivity() {
  const { bucket, region } = config.health.s3;
  if (!bucket || !region) return { status: 'skipped', details: 'S3 bucket/region not configured' };
  const url = `https://${bucket}.s3.${region}.amazonaws.com/`;
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 2000 }, (res) => {
      if (res.statusCode && res.statusCode < 500) {
        resolve({ status: 'ok', details: `reachable (${res.statusCode})` });
      } else {
        resolve({ status: 'unhealthy', details: `status ${res.statusCode}` });
      }
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'unhealthy', details: 'timeout' });
    });
    req.on('error', (err) => resolve({ status: 'unhealthy', details: String(err.message || err) }));
    req.end();
  });
}

async function checkHealth() {
  const [db, redis, s3] = await Promise.all([
    checkDbConnectivity(),
    checkRedisConnectivity(),
    checkS3Connectivity()
  ]);
  const checks = { db, redis, s3 };
  const statuses = Object.values(checks).map((c) => c.status);
  let status = 'ok';
  if (statuses.includes('unhealthy')) status = 'unhealthy';
  else if (statuses.includes('skipped')) status = 'degraded';
  return {
    status,
    timestamp: new Date().toISOString(),
    checks
  };
}

module.exports = { checkHealth };
