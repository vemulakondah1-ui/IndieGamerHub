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
| A1 | 🔵 NEXT | AdminPanel.jsx: 4 near-identical try/catch/optimistic-update handlers (toggleFeatured/togglePublished/updateRole/toggleUserStatus) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | ⚪ 1 file | Small | Open |
| A2 | 🔵 NEXT | AdminPanel.jsx: tab-switch effect refetches games/users list every time, no cache/loaded-flag guard | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | ⚪ 1 file | Small | Open |
| A3 | 🟡 LATER | AdminPanel.jsx: featuredGames (Overview) and games (Games tab) are two independently-fetched/mutated copies of "is this game featured", can drift until both refresh | 🟢 MEDIUM | 🟢 Medium | 🟢 Medium | 🟢 Good | ⚪ 1 file | Medium | Open |
| A4 | 🔵 NEXT | 3 pages (HomePage/GamesPage/AdminPanel) each hand-roll a different inline onError placeholder-image handler with a different hardcoded size/URL | ⚪ LOW | ⚪ Low | ⚪ Low | 🟢 Good | 🟢 2-5 files | Small | Open |
| A5 | ⚪ SOMEDAY | 44px WCAG touch-target implemented 4 inconsistent ways across FeaturedCarousel.css/ImageCarousel.css/Navbar.css/index.css (padding+content-box vs plain width/height) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | 🟡 6-15 files | Small | Open |
| A6 | ⚪ SOMEDAY | SteamGamePage.css's .steam-main-grid reinvents GameDetailPage.css's .game-detail-layout (same 2-col content+sidebar pattern, different breakpoint numbers) | ⚪ LOW | ⚪ Low | ⚪ Low | 🟡 Marginal | 🟢 2-5 files | Small | Open |
| A7 | ⚪ SOMEDAY | Review.js: recalcAvgRating + post-save/post-delete hooks (pre-existing, not touched this session) have no test coverage | ⚪ LOW | 🟢 Medium | 🟢 Medium | 🟡 Marginal | ⚪ 1 file | Medium | Open |
| A8 | ⚪ SOMEDAY | server.js: the NODE_TLS_REJECT_UNAUTHORIZED non-production gate only branches at module-load time; no unit test covers the "non-production" arm (verified empirically via a live Docker run instead) | ⚪ LOW | 🟢 Medium | ⚪ Low | 🔴 Poor | ⚪ 1 file | Medium | Open |

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
- **A8** - `server/server.js` lines 2-4 (the `if (process.env.NODE_ENV !== 'production') { process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; }` gate added this session): the test suite forces `NODE_ENV=production` to avoid pino-pretty's worker thread, so the guard's `true` branch never executes under `node --test`. Would need a subprocess spawn with a fresh module cache to unit-test properly. Correctness was instead verified empirically: rebuilt the Docker image and confirmed via live request that TLS rejection stays disabled only outside production.
