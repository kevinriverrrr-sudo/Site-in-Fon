const { BadImageError, InvalidApiKeyError, MissingApiKeyError, PermanentProviderError, QuotaExceededError, RateLimitError, TimeoutError, TransientProviderError } = require('../errors.js');

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const ms = date.getTime() - Date.now();
    return ms > 0 ? ms : 0;
  }
  return null;
}

class ExternalApiProvider {
  constructor({ baseUrl, apiKey, s3Storage, fetchFn, timeoutMs = 20000, maxRetries = 3, retryBaseMs = 500, logger = console } = {}) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.s3 = s3Storage;
    this.fetch = fetchFn || globalThis.fetch;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
    this.retryBaseMs = retryBaseMs;
    this.logger = logger;
  }

  async process({ sourceKey }) {
    if (!this.apiKey) throw new MissingApiKeyError();
    if (!this.fetch) throw new Error('fetch is not available in this environment');
    const inputBytes = await this.s3.getObject(sourceKey);

    let lastErr;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await this.fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'X-Api-Key': this.apiKey,
            'Accept': 'image/png,application/json',
            'Content-Type': 'application/octet-stream',
          },
          body: inputBytes,
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const contentType = res.headers?.get?.('content-type') || '';
          const buf = Buffer.from(await res.arrayBuffer());
          if (!contentType.includes('image/png')) {
            // Some providers return binary with no content-type, still accept based on PNG header
            if (buf.length < 4 || !(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47)) {
              const text = await (res.text?.() || Promise.resolve(''));
              throw new PermanentProviderError(`Unexpected response content-type: ${contentType} ${text}`);
            }
          }
          return { bytes: buf, metadata: { contentType: 'image/png', provider: 'external', bytes: buf.length, status: res.status } };
        }

        const retryAfterMs = parseRetryAfter(res.headers?.get?.('retry-after'));
        let message = '';
        try {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            message = json?.errors?.[0]?.title || json?.error?.message || json?.message || text || '';
          } catch {
            message = text || '';
          }
        } catch {
          message = '';
        }

        let err;
        if (res.status === 400) err = new BadImageError(message || 'Bad request');
        else if (res.status === 401 || res.status === 403) err = new InvalidApiKeyError(message || 'Unauthorized');
        else if (res.status === 402) err = new QuotaExceededError(message || 'Quota exceeded');
        else if (res.status === 408) err = new TimeoutError(message || 'Request timeout');
        else if (res.status === 429) err = new RateLimitError(message || 'Too Many Requests');
        else if (res.status >= 500) err = new TransientProviderError(message || `Server error ${res.status}`);
        else err = new PermanentProviderError(message || `HTTP ${res.status}`);

        if (err.retryable && attempt < this.maxRetries) {
          const backoffMs = retryAfterMs ?? Math.round(this.retryBaseMs * Math.pow(2, attempt) + Math.random() * 100);
          this.logger.warn?.(`ExternalApiProvider retrying after ${backoffMs}ms due to: ${err.message}`);
          await sleep(backoffMs);
          lastErr = err;
          continue;
        }
        throw err;
      } catch (e) {
        clearTimeout(timer);
        const isAbort = e?.name === 'AbortError';
        const err = isAbort ? new TimeoutError('Request aborted due to timeout') : e;
        if ((err.retryable || isAbort) && attempt < this.maxRetries) {
          const backoffMs = Math.round(this.retryBaseMs * Math.pow(2, attempt) + Math.random() * 100);
          this.logger.warn?.(`ExternalApiProvider retrying after ${backoffMs}ms due to: ${err.message}`);
          await sleep(backoffMs);
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw lastErr || new TransientProviderError('Unknown provider failure');
  }
}

module.exports = { ExternalApiProvider };