const { InMemoryS3Storage } = require('../src/storage/S3Storage.js');
const { Worker } = require('../src/worker/Worker.js');
const { createJob, clearJobs } = require('../src/jobs/db.js');
const { enqueueJob } = require('../src/queue/enqueue.js');
const { MissingApiKeyError } = require('../src/errors.js');

beforeEach(() => {
  clearJobs();
});

describe('Worker integration with provider and S3', () => {
  test('successful processing uploads PNG to S3 and updates job', async () => {
    const s3 = new InMemoryS3Storage();
    const sourceKey = 'uploads/src.jpg';
    await s3.putObject({ key: sourceKey, body: Buffer.from([1,2,3]), contentType: 'image/jpeg' });

    const provider = { async process() { return { bytes: Buffer.from([137,80,78,71,0,0,0]), metadata: { contentType: 'image/png' } }; } };

    const job = createJob({ sourceKey });

    const worker = new Worker({ provider, s3Storage: s3, bucket: 'mem' });
    const processed = await worker.process(job.id);

    expect(processed.status).toBe('COMPLETED');
    expect(processed.resultKey).toMatch(/^results\//);
    const stored = await s3.getObject(processed.resultKey);
    expect(Buffer.isBuffer(stored)).toBe(true);
  });

  test('provider error results in FAILED job with reason', async () => {
    const s3 = new InMemoryS3Storage();
    const sourceKey = 'uploads/src.jpg';
    await s3.putObject({ key: sourceKey, body: Buffer.from([1,2,3]), contentType: 'image/jpeg' });

    const provider = { async process() { throw new Error('bad image content'); } };

    const job = createJob({ sourceKey });
    const worker = new Worker({ provider, s3Storage: s3, bucket: 'mem' });
    const processed = await worker.process(job.id);

    expect(processed.status).toBe('FAILED');
    expect(processed.errorReason).toMatch(/bad image content/);
  });
});

describe('Enqueue job validation', () => {
  test('missing API key prevents enqueue and logs error', () => {
    const env = { ...process.env, BG_PROVIDER: 'external', EXTERNAL_API_KEY: '' };
    const logger = { error: jest.fn(), info: jest.fn() };
    expect(() => enqueueJob({ sourceKey: 'uploads/x.jpg' }, { env, logger })).toThrow(MissingApiKeyError);
    expect(logger.error).toHaveBeenCalled();
  });
});
