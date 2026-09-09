// Steam's free-text fields (game descriptions, review bodies) are HTML.
// The client already sanitizes this with DOMPurify before any dangerouslySetInnerHTML
// use (see sanitizeStoreHtml in SteamGamePage.jsx).
// This is the lightweight server-side backstop that neutralizes active script
// injection and dangerous tags without pulling in heavy JSDOM/isomorphic-dompurify
// which crashes in serverless Vercel Lambda environments.
function sanitizeHtml(html = '') {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript\s*:/gi, '');
}

module.exports = sanitizeHtml;
