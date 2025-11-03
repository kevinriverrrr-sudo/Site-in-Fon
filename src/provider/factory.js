const { ExternalApiProvider } = require('./ExternalApiProvider.js');
const { MissingApiKeyError } = require('../errors.js');

function createProvider({ config, s3Storage, fetchFn, logger = console } = {}) {
  const { bgProvider } = config;
  if (bgProvider === 'external') {
    const { baseUrl, apiKey, timeoutMs, maxRetries, retryBaseMs } = config.external;
    return new ExternalApiProvider({ baseUrl, apiKey, s3Storage, fetchFn, timeoutMs, maxRetries, retryBaseMs, logger });
  }
  throw new Error(`Unknown BG provider: ${bgProvider}`);
}

function assertProviderConfigured(config) {
  if (config.bgProvider === 'external') {
    if (!config.external.apiKey) {
      throw new MissingApiKeyError();
    }
  }
}

module.exports = { createProvider, assertProviderConfigured };