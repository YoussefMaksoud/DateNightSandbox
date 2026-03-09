# DateHub — Product Roadmap

## ✅ Completed

### Authentication & Core
- [x] Clerk authentication integration (sign-up, sign-in, session management)
- [x] Clean Architecture setup (Domain → Application → Infrastructure → Presentation)
- [x] Prisma + SQLite database with migrations
- [x] Next.js 16 App Router with proxy middleware
- [x] Domain entities: User, Activity, DateNight
- [x] API error handling with domain errors + Zod validation

### Spotify Integration
- [x] Spotify OAuth Authorization Code flow
- [x] Track search with debounced input
- [x] Shared playlist (add/remove tracks, stored in DB per room)
- [x] Spotify Embed via IFrame API with real-time `playback_update` events
- [x] Polling-based sync (2s interval) for multi-user track selection
- [x] Timer-based auto-advance (uses real playback position from IFrame API)
- [x] Progress bar synced to actual playback with "Up next" indicator

### Avatar System
- [x] Avatar domain model (AvatarConfig value object with validation)
- [x] Avatar persistence (Prisma, keyed by Clerk userId — retained between logins)
- [x] Avatar customization page (`/avatar`) with 9 categories
- [x] SVG avatar renderer with unique clipPath IDs (no collision)
- [x] Outfit type rendering — 8 distinct outfit shapes (tee, hoodie, dress-shirt, blouse, sweater, tank-top, dress, jacket)
- [x] Hair style compound matching (short-wavy, medium-curly, long-straight, etc.)
- [x] All background types (hearts, stars, sparkles, clouds, sunset, moon)
- [x] Color swatch selectors for skin tone, hair color, eye color, outfit color
- [x] Pill selectors for hair style, outfit type, accessory, expression, background
- [x] Randomize button + optimistic save with "Saved ✓" indicator
- [x] Vehicle selection (none, bike, car, airplane) — 10th customization category
- [x] 3D avatar preview on customization page (orbit controls, lit scene)
- [x] Procedural 3D avatar (low-poly character from avatar config: skin, hair, outfit, accessories, vehicles)
- [x] Walking animation (leg/arm swing + idle breathing) with directional facing
- [x] Vehicle-based movement speed (walk=4, bike=8, car=12, airplane=16)

### World Map (`/map`)
- [x] 2D game-like world with SVG terrain (trees, paths, bushes, flowers, rocks, pond, lanterns)
- [x] 6 activity quest locations with building markers and proximity detection
- [x] User avatar rendered on map with click-to-move smooth animation
- [x] Multi-user presence — see other players' avatars in real-time (polled every 2s)
- [x] Position persistence via API (MapPosition model, synced every 500ms when moving)
- [x] Quest interaction prompt with "Enter" button when avatar reaches a location
- [x] Vignette overlay, ambient glow effects, breathing avatar ring
- [x] Quest legend + controls hint
- [x] 3D map conversion (React Three Fiber + @react-three/drei)
  - [x] Low-poly terrain: flat green ground, instanced trees/bushes/flowers/rocks, pond, cobblestone paths
  - [x] 3D quest buildings with emoji signs, glow ring on proximity
  - [x] SVG avatar rendered as billboard sprite (always faces camera)
  - [x] WASD/arrow key movement with velocity-based controller
  - [x] Isometric follow-cam (~45° angle, smooth lerp tracking)
  - [x] Ambient + directional lighting with soft shadows
  - [x] Other players as billboard sprites via existing polling API
  - [x] Same backend — only rendering layer changed from SVG to WebGL

### Dashboard (`/dashboard`)
- [x] Glass-morphism cards, ambient glow, premium dark theme
- [x] Activity cards grid with type icons
- [x] Spotify playlist panel with search, now playing, progress bar
- [x] Navigation links to World Map and Avatar

### Scrapbook Station
- [x] Create/list scrapbooks with multi-page support
- [x] Three item types: photos (upload), stickers (emoji grid), text
- [x] Drag-to-reposition items with optimistic local + API persist
- [x] Collaborative polling sync (2s interval)
- [x] Page background color picker (12 colors) — persisted to API
- [x] Delete page support
- [x] Inline text editing (double-click to edit) with font, color, size controls
- [x] Item resize handles (corner drag)
- [x] Item rotation handle
- [x] Selection system (click to select, click canvas to deselect)
- [x] Photo frames (None, Polaroid, Shadow, Tape)
- [x] Tape & Clips decorative sticker panel
- [x] Bring-to-front z-index control
- [x] Cover preview on scrapbook list (auto from first photo)
- [x] Backward-compatible content parsing (old plain-string + new JSON format)

## 📋 Planned

### Scrapbook — High-Impact Features
- [x] Photobooth mode — Webcam capture with 6 filters (None, Film Grain, Warm, Cool, B&W, Vintage) + 4 overlays (Hearts, Date Stamp, Film Strip, Sparkles), 3s countdown, saves to scrapbook uploads
- [x] Handwriting tool — Freehand SVG pen drawing on pages with 7 ink colors and 4 brush sizes, save as drawing item
- [ ] Date Night auto-page — Auto-generate a scrapbook page with results/screenshots after completing an activity (trivia, race, painting)

### Scrapbook — Delight & Polish
- [x] Washi tape — 6 patterned tape strips (Pink Dots, Blue Stripe, Gold, Mint Check, Lavender, Red Heart) draggable over photos
- [x] Page templates — 4 pre-laid-out templates (Blank, 2 Photos + Caption, Collage Grid, Full Bleed) that add placeholder items
- [x] Page flip transitions — 3D perspective flip animation (rotateY) when navigating pages
- [x] Undo/redo — Ctrl+Z / Ctrl+Y support with 30-entry history stack, keyboard shortcuts for Delete

### Scrapbook — Multiplayer & Social
- [x] Live cursors — Partner cursor rendering infrastructure (fuchsia dots on canvas)
- [x] Item ownership badges — 👤 badge on hover showing who placed each item (createdBy)
- [x] Item reactions — ❤️ toggle per item with count badge, persisted via API (upsert by user+item)

### Scrapbook — Utility
- [x] Export as image — Download current page as PNG via html2canvas (2x scale)
- [x] Scrapbook sharing — Generate share token, public read-only view at /scrapbook/shared/[token] (no auth required)
- [x] Item lock — Toggle lock on items, locked items show 🔒 indicator and can't be dragged/resized/rotated

### Activities (6 Standard Types)
- [ ] Define the 6 activity types and their gameplay/interaction models
- [ ] Activity UIs accessible from quest locations on the map
- [ ] Activity completion tracking and history
- [ ] Couples activity pairing (both partners at the quest location)

### Map → Dashboard Unification
- [ ] Make the map the primary dashboard experience
- [ ] Quest panels slide out as overlays (e.g., Music Lounge opens Spotify panel)
- [ ] Remove legacy dashboard grid layout
- [ ] "Back to Map" / "Back to Dashboard" context-aware navigation

### Social & Couples
- [ ] Partner linking / invitation system
- [ ] Shared couple profile
- [ ] Partner presence indicator (online/offline)
- [ ] In-app chat or reactions during activities

### Polish & Infrastructure
- [x] Map graphics upgrade — 3D conversion with React Three Fiber
- [ ] Real-time sync upgrade (WebSockets / SSE to replace polling)
- [ ] Mobile-responsive map with touch gestures
- [ ] Onboarding flow (avatar creation → partner invite → first activity)
- [ ] Notifications (partner started an activity, partner is online)

### Future Ideas
- [ ] Avatar animations (walking, waving, dancing)
- [ ] Spotify Web Playback SDK upgrade (Premium users, true audio sync)
- [ ] Achievement system / date night streaks
- [ ] Seasonal map themes / event decorations
- [ ] Voice chat integration
- [ ] To-do feature to keep track of changes
- [ ] Date night calendar (send us a text 2 days before)
- [ ] Escape room activity
