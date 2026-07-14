// API-key check for the communicator routes, mirroring the standalone service's
// X-API-Key middleware. The Keystone backend calls /query service-to-service
// with this key.
//
// COMMUNICATOR_API_KEYS is a comma-separated list of valid keys. If it is not
// configured, the check is disabled (returns true) so local/dev works without a
// key — matching the original service's "optional until configured" posture.

const apiKeys = (process.env.COMMUNICATOR_API_KEYS || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean);

export function isValidCommunicatorKey(key?: string): boolean {
  // No keys configured -> auth disabled
  if (apiKeys.length === 0) {
    return true;
  }
  if (!key) {
    return false;
  }
  return apiKeys.includes(key);
}
