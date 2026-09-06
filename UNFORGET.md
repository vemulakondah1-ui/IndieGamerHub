<!-- unforget-format: v1 -->
# Deferred Work — IndieGamerHub

Single source of truth for paused plans, session spillover, audit findings, and observed bugs.
See `feat/production-readiness-fixes` branch/PR for the session these audit findings came from.

## 1. Paused plans

*(none yet)*

| # | Target | Finding | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Fix Effort | Status |
|---|---|---|---|---|---|---|---|---|---|

## 2. Session spillover

*(none yet)*

| # | Target | Finding | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Fix Effort | Status |
|---|---|---|---|---|---|---|---|---|---|

## 3. Audit findings

| # | Target | Finding | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Fix Effort | Status |
|---|---|---|---|---|---|---|---|---|---|
| A1 | 🔵 NEXT | AdminPanel.jsx: 4 near-identical try/catch/optimistic-update handlers (toggleFeatured/togglePublished/updateRole/toggleUserStatus) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | ⚪ 1 file | Small | Fixed |
| A2 | 🔵 NEXT | AdminPanel.jsx: tab-switch effect refetches games/users list every time, no cache/loaded-flag guard | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | ⚪ 1 file | Small | Fixed |
| A3 | 🟡 LATER | AdminPanel.jsx: featuredGames (Overview) and games (Games tab) are two independently-fetched/mutated copies of "is this game featured", can drift until both refresh | 🟢 MEDIUM | 🟢 Medium | 🟢 Medium | 🟢 Good | ⚪ 1 file | Medium | Fixed |
| A4 | 🔵 NEXT | 3 pages (HomePage/GamesPage/AdminPanel) each hand-roll a different inline onError placeholder-image handler with a different hardcoded size/URL | ⚪ LOW | ⚪ Low | ⚪ Low | 🟢 Good | 🟢 2-5 files | Small | Fixed |
| A5 | ⚪ SOMEDAY | 44px WCAG touch-target implemented 4 inconsistent ways across FeaturedCarousel.css/ImageCarousel.css/Navbar.css/index.css (padding+content-box vs plain width/height) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | 🟡 6-15 files | Small | Fixed |
| A6 | ⚪ SOMEDAY | SteamGamePage.css's .steam-main-grid reinvents GameDetailPage.css's .game-detail-layout (same 2-col content+sidebar pattern, different breakpoint numbers) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | 🟢 2-5 files | Small | Fixed |
| A7 | ⚪ SOMEDAY | Review.js: recalcAvgRating + post-save/post-delete hooks (pre-existing, not touched this session) have no test coverage | ⚪ LOW | 🟢 Medium | 🟢 Medium | 🟡 Marginal | ⚪ 1 file | Medium | Fixed |
| A8 | ⚪ SOMEDAY | server.js: the NODE_TLS_REJECT_UNAUTHORIZED non-production gate only branches at module-load time; no unit test covers the "non-production" arm (verified empirically via a live Docker run instead) | ⚪ LOW | 🟢 Medium | ⚪ Low | 🔴 Poor | ⚪ 1 file | Medium | Fixed |
| A9 | ⚪ SOMEDAY | routes/games.js never wires up gameController's list/get/create/update/delete handlers (GET /api/games, GET /api/games/:id, etc. all 404) — GameDetailPage and most of gameService silently rely on dead endpoints | 🟢 MEDIUM | 🟢 Medium | 🟢 Medium | 🟢 Good | ⚪ 1 file | Medium | Open |
| A10 | ⚪ SOMEDAY | AdminPanel.jsx: page `<h1>Admin Panel</h1>` renders partially clipped behind the sticky Navbar on initial paint (seen in a full-page screenshot) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | ⚪ 1 file | Trivial | Open |
| A11 | ⚪ SOMEDAY | server/routes/steam.js: `...(response.data.featured_win \|\| [])` / `...(response.data.coming_soon \|\| [])` fallback branches in /games are the last uncovered lines (96.49% branch coverage, everything else 100%) | ⚪ LOW | ⚪ Low | ⚪ Low | 🔴 Poor | ⚪ 1 file | Trivial | Open |
| A12 | 🟡 LATER | server: `npm audit` shows 5 pre-existing vulnerabilities (3 moderate, 2 high) in the express→body-parser→qs transitive chain; fix requires the breaking `npm audit fix --force` → Express 5 upgrade | 🟢 MEDIUM | 🟡 High | 🟢 Medium | 🟡 Marginal | 🟡 6-15 files | Large | Open |

## 4. User-reported / observed

*(none yet)*

| # | Target | Finding | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Fix Effort | Status |
|---|---|---|---|---|---|---|---|---|---|

### Detail - Audit findings

- **A1** - `client/src/pages/AdminPanel.jsx` (handleToggleFeatured/handleTogglePublished/handleUpdateRole/handleToggleUserStatus, ~lines 91-135): four handlers differ only by service call, list setter, and patched field. A shared factory (`const makeToggle = (fn, setList, patch) => async (id, ...args) => {...}`) would collapse them to one instantiated 4x. Flagged by code-review pass 2 (simplification angle). Not fixed this session — touches actively-changing code for a pure DRY win, no correctness impact.
- **A2** - `client/src/pages/AdminPanel.jsx` (`useEffect([activeTab])`, ~lines 47-58): switching Overview→Games→Overview→Games re-fetches the full 50-row list every time with no cache. Flagged by code-review pass 2 (efficiency angle). Cheap fix later: a `loadedTabs` Set or `if (games.length === 0)` guard.
- **A3** - `client/src/pages/AdminPanel.jsx`: `handleToggleFeatured` (Games tab) patches local `games` state + calls `loadData()` to keep Overview's `featuredGames` in sync (this session's fix for a stale-count bug); `handleRemoveFeatured` (Overview tab) only calls `loadData()`. Two different sync mechanisms for the same underlying "is this game featured" fact. Real fix: derive `featuredGames` from `games` (`games.filter(g => g.isFeatured)`) instead of a separately-fetched array, or route both actions through one handler. **Verify-still-open:** `grep -n "handleToggleFeatured\|handleRemoveFeatured" client/src/pages/AdminPanel.jsx` — expect both handlers still present with independent update logic.
- **A4** - `client/src/pages/HomePage.jsx:78`, `client/src/pages/GamesPage.jsx:263`, `client/src/pages/AdminPanel.jsx` (~line 207): each does `onError={e => e.target.src = 'https://via.placeholder.com/WxH?text=No+Image'}` with a different WxH. Extract to `client/src/utils/imageFallback.js` (mirrors the `getErrorMessage.js` precedent from this same session) or a shared `<GameThumbnail>` component. Depends on a third-party placeholder service staying up — worth swapping for a bundled local asset while at it.
- **A5** - Touch-target fix reimplemented 4 ways: `FeaturedCarousel.css`/`ImageCarousel.css` use `padding:18px`+`background-clip:content-box` on an 8px dot; `Navbar.css`'s hamburger and `index.css`'s `.pagination-btn` just set `width/height:44px` directly. Consolidate behind a `--tap-target-min: 44px` custom property in `index.css`'s `:root`.
- **A6** - `client/src/pages/SteamGamePage.css` (`.steam-main-grid`, `minmax(0,2fr) minmax(300px,1fr)`, collapses at 900px) vs `client/src/pages/GameDetailPage.css` (`.game-detail-layout`, `1fr 320px`, collapses at 1024px) — same "content + fixed sidebar" pattern, different numbers. Consolidate into one shared layout class.
- **A7** - `server/models/Review.js` lines 51-70/75/80 (recalcAvgRating, post('save')/post('findOneAndDelete') hooks) predate this session's `{game:1}` index addition and have no test coverage. Out of scope for this branch's "cover just the changes" target; a real DB-backed integration test would be the right tool (these hooks need Mongoose middleware + a live/in-memory Mongo, not a unit test).
- **A8** - `server/server.js` lines 2-4 (the `if (process.env.NODE_ENV !== 'production') { process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; }` gate added this session): the test suite forces `NODE_ENV=production` to avoid pino-pretty's worker thread, so the guard's `true` branch never executes under `node --test`. **Fixed**: extracted into `server/utils/tlsGate.js`'s pure `applyTlsGate(env)` function, directly unit-tested with fake env objects (`server/test/tlsGate.test.js`, 3 cases) — no subprocess spawn needed.
- **A9** - `server/routes/games.js` never requires `gameController` — only `getDevGamesHandler`/`fetchLiveGenreStats` are mounted. `GET /api/games`, `GET /api/games/:id`, `POST /api/games`, etc. all 404. Discovered during tonight's screenshot verification: `GameDetailPage` falls back to its hardcoded placeholder for every game because its backing route doesn't exist (compounded by an empty local Mongo `games` collection, so the DB emptiness alone wasn't the full story). Pre-existing, unrelated to the Steam fix or A1-A8; not fixed tonight since it's a separate, larger feature gap (needs deciding whether to wire up the existing dead `gameController.js`-equivalent logic or write it fresh, and to backfill seed data). **Verify-still-open:** `grep -n "router\.\(get\|post\|put\|delete\)" server/routes/games.js` — expect no `/:id`-style route for a single game.
- **A10** - `client/src/pages/AdminPanel.jsx`'s `<h1>Admin Panel</h1>` renders partially clipped behind the sticky `Navbar` on first paint, seen in a full-page Playwright screenshot taken during tonight's verification. Cosmetic only, pre-existing (not touched this session), likely a missing top-padding/scroll-margin on the page wrapper. Trivial to fix but out of scope for tonight's pass.
- **A11** - `server/routes/steam.js`'s `/games` handler, `...(response.data.featured_win || [])` and `...(response.data.coming_soon || [])` (lines ~67-68): the `|| []` fallback (when Steam's response is missing one of these keys entirely) is the only remaining uncovered branch pair after tonight's test-writing pass — `server/test/steamRoutes.test.js` is otherwise 100% lines/functions, 96.49% branches on this file. Forcing a clean cache-miss to exercise it would need another mock-timers dance on the shared `'games'` cache key; low value for a purely defensive array guard, so left as a disclosed gap rather than chased further.
- **A12** - Surfaced by adding a `npm audit --audit-level=critical` gate to CI tonight (`.github/workflows/ci.yml`): `server`'s `express@4.22.2` depends on a vulnerable `body-parser`/`qs` chain (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g — array-limit bypass + DoS via attacker-controlled `isBuffer`). `npm audit fix --force` would resolve it but bumps to `express@5.2.1`, a breaking major-version change touching middleware/routing across every route file — deliberately not attempted tonight. Gated CI at `critical` (not `high`) specifically so this pre-existing debt doesn't fail every future build; revisit as a dedicated Express 5 migration task.
