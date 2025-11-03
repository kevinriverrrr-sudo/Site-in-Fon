const sinkDefault = (level, payload) => {
  // Print structured JSON logs
  const entry = { level, time: new Date().toISOString(), ...payload };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
};

let sink = sinkDefault;

function setLoggerSink(fn) {
  sink = typeof fn === 'function' ? fn : sinkDefault;
}

function withRequest(req, base = {}) {
  const requestId = req?.id || req?.headers?.['x-request-id'] || null;
  return { requestId, ...base };
}

function info(obj) { sink('info', obj); }
function warn(obj) { sink('warn', obj); }
function error(obj) { sink('error', obj); }

module.exports = { info, warn, error, withRequest, setLoggerSink };
