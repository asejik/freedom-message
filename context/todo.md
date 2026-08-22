# Project Master Plan (todo.md)

## Epic 1: Project Initialization & Dependency Wiring
- [x] Initialize Next.js 15 App Router project (`web/`).
- [x] Configure TypeScript, ESLint, and Tailwind CSS.
- [x] Install core dependencies (`@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `lucide-react`, `clsx`, `tailwind-merge`, `@groq/groq-sdk`, `papaparse`, `xlsx`).
- [x] Configure Tailwind CSS with strict OKLCH design tokens.
- [x] Update project context files.

## Epic 2: Database Schema & Strict Security ✅ DONE
- [x] Setup Supabase project (pending user: create project + add `.env.local` keys).
- [x] Create `preachers` table (`web/supabase/schema.sql`).
- [x] Create `series` table (`web/supabase/schema.sql`).
- [x] Create `sermons` table with `transcript_text`, `ai_summary`, `ai_tags` columns (`web/supabase/schema.sql`).
- [x] Add GIN full-text search indexes on `transcript_text` and `title`.
- [x] Implement strict Row Level Security (RLS) — anon SELECT, authenticated write.
- [x] Add `search_sermons(query)` PostgreSQL helper function.
- [x] Export TypeScript interfaces (`Preacher`, `Series`, `Sermon`, `SermonWithRelations`, `Database`) at `web/src/types/database.ts`.

## Epic 3: Data Migration Script ✅ DONE
- [x] Choose Python for pipeline (consistent with existing `scripts/` ecosystem).
- [x] Build `scripts/pipeline.py` — Excel extractor + transcript matcher + JSON serializer.
- [x] Run pipeline → generate `output/clc_consolidated_staging.json`.
- [x] Build `scripts/enrich_data.py` with strict rate limiting, fault tolerance, and incremental processing.
- [x] Run enrichment pipeline → `output/clc_enriched_staging.json`.
- [x] Build `scripts/hydrate_db.py` to upsert enriched data securely to Supabase.

## Epic 4: Global Audio Engine ✅ DONE
- [x] Implement Zustand state store (`useAudioStore.ts`) for continuous playback.
- [x] Build atomic HTML5 AudioProvider component.
- [x] Build bottom-docked glass UI player component (`GlobalPlayer.tsx`).
- [x] Handle mobile background play and MediaSession API.

## Epic 5: The Discoverability Layer ✅ DONE
- [x] Integrate Groq API for natural language intent extraction (`api/search/route.ts`).
- [x] Build UI search bar with glassmorphism styling (`SearchBar.tsx`).
- [x] Implement TanStack Query caching for search results (`SermonList.tsx`).
- [x] Implement full-text transcript search fallback in Supabase (`search_sermons` RPC).

## Epic 5b: Premium UI Overhaul ✅ DONE
- [x] Build standard catalog API `api/sermons/route.ts`.
- [x] Build `FilterBar.tsx` with sticky glassmorphism, horizontal ribbon, FilterChip popovers for Preacher & Series.
- [x] Rebuild `SermonCard.tsx` with spec layout: aspect-video gradient artwork, hover play overlay, series label, tags.
- [x] Overhaul `page.tsx` with Hero section, segment toggle (Browse / Ask AI), live 3-col grid, bottom gradient buffer.

## Epic 6: Admin Tools 🔄 IN PROGRESS
- [x] Create protected admin routes with Supabase Auth (`/login`, `/admin/layout.tsx`).
- [x] Build `api/admin/sermons` POST route with on-the-fly Groq enrichment.
- [x] Build single upload form UI.
- [ ] Build bulk CSV upload and validation UI.

## Hotfixes & UX Enhancements ✅ DONE
- [x] Fix React Hook violation in `GlobalPlayer.tsx` (conditional returns).
- [x] Implement robust error handling & fallback in `api/search/route.ts`.
- [x] Remove debounce and implement explicit form submission in `SearchBar.tsx`.
- [x] Fix layout overlapping in `page.tsx` Hero section.

## Epic 7: Simulated Live Broadcast
- [ ] Create admin scheduling schema for simulated live events.
- [ ] Implement global client-side time-offset sync.
- [ ] Build UI state transitions (e.g., gold indicator for "Live" status).

## Epic 8: Vercel Deployment & Egress Audit
- [ ] Deploy frontend to Vercel.
- [ ] Perform zero-latency egress optimization.
- [ ] Conduct strict OWASP security audit.
