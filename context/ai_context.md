# CLC Sermon Platform — Project Status

Last Updated: 2026-07-17
Status: **Epic 3 (Pipeline) Complete — Staging JSON ready for Groq enrichment**

---

## 1. Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 16 (App Router, TypeScript, ESLint)
- **Styling:** Tailwind CSS v4 — strict OKLCH design tokens via `globals.css`
- **State:** Zustand (global audio engine, UI state)
- **Data Fetching:** TanStack Query (caching, background refetch)
- **Icons:** Lucide React
- **Utilities:** clsx, tailwind-merge

### Backend / Data
- **Database:** Supabase (Postgres + RLS)
- **Auth:** Supabase Auth (JWT-based, RBAC for admin)
- **AI / NLP:** Groq SDK (transcript summarization, natural language search intent)

### Data Processing (local scripts — `/scripts/`)
- **Language:** Python 3
- **Libraries:** openpyxl, ffprobe (subprocess), requests, BeautifulSoup

### Architecture Pattern
```
Client (Next.js App Router)
  └── TanStack Query → Supabase (Postgres + RLS)
  └── Zustand Store → Global Audio Engine
  └── Groq SDK → NLP Search Intent + Summaries
```

### Deployment Target
- Vercel (frontend + API routes)
- Supabase (DB + Auth)

---

## 2. Key Features & Rules

### Completed
- [x] Data extraction: 1,466 sermon MP3 URLs scraped from Archive.org
- [x] Metadata enrichment: ffprobe extraction of Title, Artist, Album per sermon
- [x] Excel catalog: `output/CLC_Sermons.xlsx` — 12 year-tabs, 1,466 rows — S/N, Title, Series, Preacher, Date, URL
- [x] Preacher normalization: 51 → 29 unique canonical names
- [x] Transcription: 1,466 `.txt` transcript files in `transcripts/`
- [x] Next.js 16 project initialized in `web/`
- [x] Core dependencies installed (supabase-js, tanstack-query, zustand, groq-sdk, lucide-react, xlsx, papaparse, clsx, tailwind-merge)
- [x] Tailwind v4 OKLCH design tokens configured in `globals.css`
- [x] `context/todo.md` written with 8-Epic roadmap
- [x] `web/supabase/schema.sql` — full Postgres schema, RLS, indexes, FTS helper function
- [x] `web/src/types/database.ts` — strict TypeScript interfaces matching schema

### Design Rules (NEVER break)
- OKLCH color system only — hue 250–260 for brand, hue 85 (gold) for "Live" ONLY
- Spacing: 8px base scale (8/16/24/32/48/64/80/120px)
- Font: Inter (Google Fonts)
- Glassmorphism: `backdrop-filter: blur(12px)` + white translucent fill on interactive surfaces ONLY
- No more than 5 core color concepts
- Typography hierarchy via size/contrast — NO decorative borders
- WCAG AA contrast (≥4.5:1) on all glass panels

---

## 3. Database Schema & Auth

**Status: SQL written (`web/supabase/schema.sql`) — Supabase project creation requires user action**

### Tables

#### `preachers`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `uuid_generate_v4()` |
| name | TEXT UNIQUE NOT NULL | e.g. "Apostle Muyiwa Areo" |
| created_at | TIMESTAMPTZ | `NOW()` |

#### `series`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `uuid_generate_v4()` |
| name | TEXT UNIQUE NOT NULL | e.g. "Developing a Strong Human Spirit" |
| created_at | TIMESTAMPTZ | `NOW()` |

#### `sermons`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `uuid_generate_v4()` |
| title | TEXT NOT NULL | |
| date_preached | DATE NOT NULL | parsed from filename |
| audio_url | TEXT NOT NULL | Archive.org MP3 link |
| preacher_id | UUID FK → preachers | ON DELETE SET NULL |
| series_id | UUID FK → series | ON DELETE SET NULL, nullable |
| transcript_text | TEXT | raw .txt content |
| ai_summary | TEXT | Groq-generated 2–3 sentence summary |
| ai_tags | TEXT[] | Groq-generated topic tags |
| created_at | TIMESTAMPTZ | `NOW()` |

### Indexes
- `idx_sermons_preacher_id` — B-tree on preacher_id
- `idx_sermons_series_id` — B-tree on series_id
- `idx_sermons_date_preached` — B-tree on date_preached DESC
- `idx_sermons_transcript_fts` — GIN `to_tsvector('english', transcript_text)`
- `idx_sermons_title_fts` — GIN `to_tsvector('english', title)`
- `idx_sermons_ai_tags` — GIN on ai_tags array

### RLS Policies
| Table | Operation | Role |
|---|---|---|
| all | SELECT | anon + authenticated |
| all | INSERT | authenticated only |
| all | UPDATE | authenticated only |
| all | DELETE | authenticated only |

### Helper Functions
- `search_sermons(query TEXT)` — Full-text search across `transcript_text` + `title`, ranked by `ts_rank`

### Pending (user action required)
- Create Supabase project at supabase.com
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `web/.env.local`
- Run `web/supabase/schema.sql` in Supabase SQL Editor

---

## 4. File Map

```
audio/                              ← project root
├── context/
│   ├── ai_context.md               ← THIS FILE (Single Source of Truth)
│   ├── ai_context_protocol.md
│   ├── context_map_protocol.md
│   ├── design.md
│   ├── spec.md
│   └── todo.md
│
├── scripts/                        ← Data processing & utility scripts
│   ├── .env                      ← Keys for scripts (Groq, Supabase Service Role)
│   ├── pipeline.py               ← Extracts Excel + Transcripts -> JSON
│   ├── enrich_data.py            ← Calls Groq API for summaries/tags
│   └── hydrate_db.py             ← Uploads JSON to Supabase with relations
│   ├── assemblyai_script.py
│   ├── generate_assemblyai_script.py
│   └── transcribe.py
│
├── output/
│   ├── CLC_Sermons.xlsx                    ← 1,466 rows, 12 sheets
│   └── clc_consolidated_staging.json       ← ✅ NEW: 88 MB unified staging file
│
├── transcripts/                    ← 1,466 .txt files
│   ├── 2015 transcripts/  (58)
│   ├── 2016 transcripts/  (95)
│   ├── 2017 transcripts/  (104)
│   ├── 2018 transcripts/  (119)
│   ├── 2019 transcripts/  (164)
│   ├── 2020 transcripts/  (136)
│   ├── 2021 transcripts/  (157)
│   ├── 2022 transcripts/  (157)
│   ├── 2023 transcripts/  (148)
│   ├── 2024 transcripts/  (149)
│   ├── 2025 transcripts/  (119)
│   └── 2026 transcripts/  (60)
│
├── web/                            ← Next.js 16 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx        ← Protected auth wrapper ✅
│   │   │   │   └── page.tsx          ← Admin dashboard (Single upload) ✅
│   │   │   ├── api/
│   │   │   │   ├── admin/sermons/
│   │   │   │   │   └── route.ts      ← POST single upload + Groq enrichment ✅
│   │   │   │   └── search/
│   │   │   │       └── route.ts      ← Groq intent + Supabase FTS endpoint ✅
│   │   │   ├── login/
│   │   │   │   └── page.tsx          ← Auth UI ✅
│   │   │   ├── globals.css           ← OKLCH tokens, glass utilities ✅
│   │   │   ├── layout.tsx          ← Root layout wrapping providers ✅
│   │   │   └── page.tsx            ← Home page with search integration ✅
│   │   ├── components/
│   │   │   ├── audio/
│   │   │   │   └── GlobalPlayer.tsx  ← Glass UI player component ✅
│   │   │   ├── providers/
│   │   │   │   ├── AudioProvider.tsx ← Headless HTML5 audio sync ✅
│   │   │   │   └── QueryProvider.tsx ← TanStack Query client ✅
│   │   │   ├── search/
│   │   │   │   └── SearchBar.tsx     ← UI search bar ✅
│   │   │   └── sermons/
│   │   │       ├── SermonCard.tsx    ← UI card with play integration ✅
│   │   │       └── SermonList.tsx    ← TanStack Query grid ✅
│   │   ├── lib/
│   │   │   └── supabase.ts           ← Supabase client ✅
│   │   ├── store/
│   │   │   └── useAudioStore.ts      ← Zustand audio engine state ✅
│   │   ├── types/
│   │   │   └── database.ts           ← TypeScript interfaces ✅
│   │   └── utils/
│   │       └── supabase/
│   │           ├── client.ts         ← SSR Browser client ✅
│   │           └── server.ts         ← SSR Server client ✅
│   ├── supabase/
│   │   └── schema.sql              ← Postgres schema + RLS ✅
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── postcss.config.mjs
│
└── audio_files/                    ← 2 sample MP3s
```

---

## 5. Roadmap & Next Steps

- [x] **Epic 1:** Project Initialization & Dependency Wiring
- [x] **Epic 2:** Database Schema & Strict Security *(SQL + RLS + TS types written; Supabase project creation pending user)*
- [x] **Epic 3:** Data Pipeline *(`scripts/pipeline.py` runs clean — 1,466/1,466 matched at 100%; `output/clc_consolidated_staging.json` (88 MB) ready)*
- [x] **Epic 3b:** Groq Enrichment script *(`enrich_data.py` complete, `clc_enriched_staging.json` built)*
- [x] **Epic 3c:** Database Hydration *(`hydrate_db.py` handles mapping and bulk upsert to live Supabase DB)*
- [x] **Epic 4:** Global Audio Engine *(Zustand store, AudioProvider, GlobalPlayer built & wired into layout)*
- [x] **Epic 5:** Discoverability Layer *(Groq intent API, TanStack query, UI SearchBar & SermonGrid built)*
- [x] **Epic 6:** Admin Tools *(Protected layout, `/login` UI, Single Upload Form, and `api/admin/sermons` built)*
- [x] **Hotfixes:** React Hooks, Search API robust error handling, Search UX explicit form submit, Hero UI flexbox spacing.
- [ ] **Epic 7:** Simulated Live Broadcast
- [ ] **Epic 8:** Vercel Deployment & Egress Audit

---

## 6. Known Issues & Technical Debt

- `groq-sdk` is the correct npm package name (not `@groq/groq-sdk` — that 404s)
- Supabase project not yet created — `web/.env.local` does not exist yet
- The data migration script (Epic 3) must resolve transcript↔sermon matching by filename (no direct link column in xlsx)
- `audio_files/` contains only 2 sample MP3s — not part of the migration pipeline
