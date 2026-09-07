const DOMPurify = require('isomorphic-dompurify');

// Steam's free-text fields (game descriptions, review bodies) are raw HTML.
// The client already strips this with DOMPurify before any dangerouslySetInnerHTML
// use (see sanitizeStoreHtml in SteamGamePage.jsx) — this is the server-side
// backstop so a future passthrough field rendered as HTML isn't unsanitized
// by default.
function sanitizeHtml(html = '') {
  return DOMPurify.sanitize(String(html));
}

module.exports = sanitizeHtml;
