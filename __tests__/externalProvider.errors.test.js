const { ExternalApiProvider } = require('../src/provider/ExternalApiProvider.js');
const { InMemoryS3Storage } = require('../src/storage/S3Storage.js');
const { BadImageError } = require('../src/errors.js');

function makeResponse({ status = 400, headers = {}, body = new TextEncoder().encode(JSON.stringify({ message: 'Bad image' })) } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k.toLowerCase()] || headers[k] || null },
    async arrayBuffer() { return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength); },
    async text() { return new TextDecoder().decode(body); },
  };
}

describe('ExternalApiProvider error handling', () => {
  test('400 Bad image yields BadImageError', async () => {
    const s3 = new InMemoryS3Storage();
    const sourceKey = 'uploads/bad.jpg';
    await s3.putObject({ key: sourceKey, body: Buffer.from([9,9,9]), contentType: 'image/jpeg' });

    const fetchMock = jest.fn().mockResolvedValueOnce(makeResponse({ status: 400, headers: { 'content-type': 'application/json' }, body: new TextEncoder().encode(JSON.stringify({ message: 'bad image content' })) }));

    const provider = new ExternalApiProvider({ baseUrl: 'https://api.example/remove', apiKey: 'abc', s3Storage: s3, fetchFn: fetchMock, timeoutMs: 2000 });

    await expect(provider.process({ sourceKey })).rejects.toBeInstanceOf(BadImageError);
  });

  test('429 rate limit retries then succeeds', async () => {
    const s3 = new InMemoryS3Storage();
    const sourceKey = 'uploads/rate.jpg';
    await s3.putObject({ key: sourceKey, body: Buffer.from([1,1,1]), contentType: 'image/jpeg' });

    const responses = [
      makeResponse({ status: 429, headers: { 'retry-after': '0' }, body: new TextEncoder().encode('rate limit') }),
      makeResponse({ status: 200, headers: { 'content-type': 'image/png' }, body: new Uint8Array([137,80,78,71,0,0]) }),
    ];
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1]);

    const provider = new ExternalApiProvider({ baseUrl: 'https://api.example/remove', apiKey: 'abc', s3Storage: s3, fetchFn: fetchMock, timeoutMs: 2000, retryBaseMs: 1, maxRetries: 3 });

    const res = await provider.process({ sourceKey });
    expect(res.bytes).toBeInstanceOf(Buffer);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
