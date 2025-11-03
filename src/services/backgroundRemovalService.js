const { BACKGROUND_REMOVAL_API_KEY } = require('../config');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeBackground({ jobId, sourceKey, userId }) {
  if (!BACKGROUND_REMOVAL_API_KEY) {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }
  await sleep(250); // simulate small processing latency
  // Return a pretend result key, e.g., where the processed image would be stored.
  return { resultKey: `${sourceKey}.nobg` };
}

module.exports = { removeBackground };
