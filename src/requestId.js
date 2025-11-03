const { customAlphabet } = require('nanoid');
const makeId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

function requestIdMiddleware(req, res, next) {
  const headerId = req.headers['x-request-id'];
  req.id = headerId && String(headerId).trim().length > 0 ? String(headerId) : makeId();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = { requestIdMiddleware };
