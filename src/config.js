function loadConfig(env = process.env) {
  return {
    bgProvider: env.BG_PROVIDER || 'external',
    external: {
      baseUrl: env.EXTERNAL_API_URL || 'https://api.remove.bg/v1.0/removebg',
      apiKey: env.EXTERNAL_API_KEY || '',
      timeoutMs: env.EXTERNAL_API_TIMEOUT_MS ? Number(env.EXTERNAL_API_TIMEOUT_MS) : 20000,
      maxRetries: env.EXTERNAL_API_MAX_RETRIES ? Number(env.EXTERNAL_API_MAX_RETRIES) : 3,
      retryBaseMs: env.EXTERNAL_API_RETRY_BASE_MS ? Number(env.EXTERNAL_API_RETRY_BASE_MS) : 500,
    },
    s3: {
      bucket: env.S3_BUCKET || 'images-bucket',
      region: env.AWS_REGION || 'us-east-1',
    }
  };
}

module.exports = { loadConfig };