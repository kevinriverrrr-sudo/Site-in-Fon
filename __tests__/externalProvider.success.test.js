const { ExternalApiProvider } = require('../src/provider/ExternalApiProvider.js');
const { InMemoryS3Storage } = require('../src/storage/S3Storage.js');

function makeResponse({ status = 200, headers = {}, body = new Uint8Array([137,80,78,71,1,2,3]) } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k.toLowerCase()] || headers[k] || null },
    async arrayBuffer() { return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength); },
    async text() { return new TextDecoder().decode(body); },
  };
}

describe('ExternalApiProvider success', () => {
  test('process returns PNG bytes and metadata', async () => {
    const s3 = new InMemoryS3Storage();
    const sourceKey = 'uploads/img1.jpg';
    await s3.putObject({ key: sourceKey, body: Buffer.from([1,2,3]), contentType: 'image/jpeg' });

    const fetchMock = jest.fn().mockResolvedValueOnce(makeResponse({ status: 200, headers: { 'content-type': 'image/png' }, body: new Uint8Array([137,80,78,71,0,0]) }));

    const provider = new ExternalApiProvider({ baseUrl: 'https://api.example/remove', apiKey: 'abc', s3Storage: s3, fetchFn: fetchMock, timeoutMs: 2000 });

    const result = await provider.process({ sourceKey });
    expect(Buffer.isBuffer(result.bytes)).toBe(true);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.metadata.contentType).toBe('image/png');
    expect(result.metadata.provider).toBe('external');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
