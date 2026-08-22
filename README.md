# Freedom Messages — Sermon Platform

A modern, high-performance audio sermon streaming platform for **Freedom Messages** (Apostle Muyiwa Areo and ministers).

## 🚀 Tech Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Global Audio Player)
- **Data Caching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **AI Intent & Semantic Search:** [Groq SDK](https://groq.com/) (Deepseek / Llama RAG)
- **Styling:** Vanilla Tailwind CSS v4, Lucide Icons, Google Fonts (ES Klarheit & Geist)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm / yarn / pnpm

### Installation
```bash
cd web
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local` inside `web/`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys and Groq API key:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

### Running Locally
```bash
cd web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Vercel Deployment

1. Push this repository to GitHub (`asejik/freedom-message`).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import the `freedom-message` repository.
4. Set **Root Directory** to `web`.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
6. Click **Deploy**.
