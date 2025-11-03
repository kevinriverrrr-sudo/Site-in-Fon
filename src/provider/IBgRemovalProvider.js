// Conceptual interface (JSDoc) for background removal providers

/**
 * @typedef {Object} ProcessParams
 * @property {string} sourceKey - S3 key of source image
 */

/**
 * @typedef {Object} ProcessResult
 * @property {Buffer} bytes - PNG bytes with transparency
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * @interface IBgRemovalProvider
 * @function process
 * @param {ProcessParams} params
 * @returns {Promise<ProcessResult>}
 */
function IBgRemovalProvider() { /* documentation only */ }

module.exports = { IBgRemovalProvider };
