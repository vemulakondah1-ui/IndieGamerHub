// Disabling TLS verification process-wide would MITM-expose every outbound HTTPS call (Steam, RAWG, Cloudinary); require an explicit opt-in rather than `!== 'production'`, which would fail open (TLS off) if NODE_ENV is simply unset.
function applyTlsGate(env = process.env) {
  if (env.NODE_ENV === 'development') {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

module.exports = { applyTlsGate };
