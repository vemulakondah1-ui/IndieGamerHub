// Disabling TLS verification process-wide would MITM-expose every outbound HTTPS call (Steam, RAWG, Cloudinary); only allow it outside production.
function applyTlsGate(env = process.env) {
  if (env.NODE_ENV !== 'production') {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

module.exports = { applyTlsGate };
