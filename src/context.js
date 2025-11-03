const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');

const storage = new AsyncLocalStorage();

function runWithContext(ctx, fn) {
  return storage.run(ctx, fn);
}

function runWithRequestId(requestId, fn) {
  const ctx = { requestId: requestId || randomUUID() };
  return runWithContext(ctx, fn);
}

function getContext() {
  return storage.getStore() || {};
}

function getRequestId() {
  const store = storage.getStore();
  return (store && store.requestId) || undefined;
}

module.exports = {
  runWithContext,
  runWithRequestId,
  getContext,
  getRequestId
};
