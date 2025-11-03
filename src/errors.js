class ProviderError extends Error {
  constructor(message, { code, retryable } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'PROVIDER_ERROR';
    this.retryable = !!retryable;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class MissingApiKeyError extends ProviderError {
  constructor(message = 'Background removal provider API key missing') {
    super(message, { code: 'MISSING_API_KEY', retryable: false });
  }
}

class InvalidApiKeyError extends ProviderError {
  constructor(message = 'Invalid API key for background removal provider') {
    super(message, { code: 'INVALID_API_KEY', retryable: false });
  }
}

class QuotaExceededError extends ProviderError {
  constructor(message = 'API quota exceeded') {
    super(message, { code: 'QUOTA_EXCEEDED', retryable: false });
  }
}

class BadImageError extends ProviderError {
  constructor(message = 'Unsupported or bad image input') {
    super(message, { code: 'BAD_IMAGE', retryable: false });
  }
}

class RateLimitError extends ProviderError {
  constructor(message = 'Rate limited by provider') {
    super(message, { code: 'RATE_LIMIT', retryable: true });
  }
}

class TimeoutError extends ProviderError {
  constructor(message = 'Provider request timed out') {
    super(message, { code: 'TIMEOUT', retryable: true });
  }
}

class TransientProviderError extends ProviderError {
  constructor(message = 'Transient provider error') {
    super(message, { code: 'TRANSIENT', retryable: true });
  }
}

class PermanentProviderError extends ProviderError {
  constructor(message = 'Permanent provider error') {
    super(message, { code: 'PERMANENT', retryable: false });
  }
}

module.exports = {
  ProviderError,
  MissingApiKeyError,
  InvalidApiKeyError,
  QuotaExceededError,
  BadImageError,
  RateLimitError,
  TimeoutError,
  TransientProviderError,
  PermanentProviderError,
};