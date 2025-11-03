const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('node:stream');

function toBuffer(body) {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body && typeof body.pipe === 'function') {
    // Readable stream
    return new Promise((resolve, reject) => {
      const chunks = [];
      body.on('data', chunk => chunks.push(chunk));
      body.on('error', reject);
      body.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  if (body instanceof Readable) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      body.on('data', chunk => chunks.push(chunk));
      body.on('error', reject);
      body.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  throw new Error('Unsupported S3 body type');
}

class S3Storage {
  constructor({ bucket, client } = {}) {
    this.bucket = bucket;
    this.client = client || new S3Client({});
  }

  async getObject(key) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const buf = await toBuffer(res.Body);
    return buf;
  }

  async putObject({ key, body, contentType = 'application/octet-stream' }) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return { key };
  }
}

// A simple in-memory S3-like storage for tests
class InMemoryS3Storage {
  constructor() {
    this.store = new Map();
    this.bucket = 'mem';
  }
  async getObject(key) {
    const v = this.store.get(key);
    if (!v) throw new Error(`Key not found: ${key}`);
    return Buffer.from(v.body);
  }
  async putObject({ key, body, contentType }) {
    this.store.set(key, { body: Buffer.from(body), contentType });
    return { key };
  }
}

module.exports = { S3Storage, InMemoryS3Storage };