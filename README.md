# AEM Developer Knowledge Hub

A headless content delivery and AI-powered knowledge retrieval system built with **Adobe Experience Manager (AEM) Content Fragments**, **Next.js 15 App Router**, and a **RAG pipeline** (Supabase pgvector + Google Gemini), deployed on Vercel.

**[▶ Part 1: AEM Headless Walkthrough (YouTube)](https://www.youtube.com/watch?v=_i5v-sK-o-U)** | **[▶ Part 2: RAG AI Assistant Demo (YouTube)](https://youtu.be/QuMy2E1jz7c)** | **[Live Demo](https://aem-headless-nextjs.vercel.app)**

---

## What This Is

A developer knowledge portal covering AEM, AEP, and AJO topics. Content is authored as Content Fragments in AEM and delivered headlessly via GraphQL persisted queries to a Next.js frontend. A streaming AI chat assistant — grounded exclusively to the published Content Fragments — answers developer questions in natural language with source attribution.

**Live content includes:**
- 15 technical articles across 5 categories (AEM, AEP, AJO, Architecture, DevOps)
- 30+ FAQs organised by category
- 3 step-by-step tutorials with structured tutorial steps
- 3 author profiles

---

## Tech Stack

| Layer | Technology |
|---|---|
| CMS | AEM SDK Author (local, port 4502) |
| Content model | AEM Content Fragments (5 models) |
| API | AEM GraphQL persisted queries |
| Tunnel | ngrok static domain |
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS v4 |
| AI chat | Vercel AI SDK v6 (`@ai-sdk/react` + `@ai-sdk/google`) |
| Embeddings | Google `gemini-embedding-001` via `@google/genai` (768 dims) |
| LLM | Google `gemini-3-flash-preview` |
| Vector store | Supabase pgvector — `cf_embeddings` table, HNSW index |
| Deployment | Vercel (free tier) |
| Version control | Git → GitHub |

---

## Content Fragment Models

| Model | Key fields |
|---|---|
| **Article** | khTitle, khSlug, khCategory (enum), khDifficulty (enum), khSeoDescription, khBody (rich text), khAuthor (fragment ref), khRelatedFAQs (multi fragment ref) |
| **FAQ** | khQuestion, khAnswer (rich text), khCategory (enum) |
| **Tutorial** | khTitle, khSlug, khDifficulty (enum), khSteps (multi fragment ref), khRelatedFAQs (multi fragment ref) |
| **TutorialStep** | khStepNumber, khTitle, khContent (rich text), khCodeSnippet |
| **Author** | khName, khBio (rich text), khAvatar (image ref) |

All model fields use the `kh` prefix to avoid conflicts in multi-site AEM installations.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage — latest 6 articles + category browse
│   ├── articles/
│   │   ├── page.tsx                # Article listing with category filter
│   │   └── [slug]/page.tsx         # Article detail + generateMetadata (SEO)
│   ├── faqs/page.tsx               # FAQs grouped by category with accordion
│   ├── tutorials/
│   │   ├── page.tsx                # Tutorial listing
│   │   └── [slug]/page.tsx         # Tutorial detail with step-by-step layout
│   └── api/
│       ├── chat/route.ts           # RAG chat endpoint (embed → pgvector → Gemini stream)
│       ├── seo-gen/route.ts        # On-demand SEO description generation + AEM write-back
│       └── revalidate/route.ts     # ISR webhook for AEM replication events
├── components/
│   ├── ChatWidget.tsx              # Streaming AI chat widget (Vercel AI SDK v6)
│   ├── ArticleCard.tsx
│   ├── ArticleDetail.tsx
│   ├── FAQAccordion.tsx            # Client component with useState
│   ├── TutorialSteps.tsx
│   └── AuthorBio.tsx
├── lib/
│   ├── aem-client.ts               # Dual-mode: real AEM or static mock fallback
│   ├── supabase.ts                 # Lazy Supabase singleton (avoids build-time crash)
│   ├── queries.ts                  # GraphQL persisted query names + CATEGORIES constant
│   └── html-utils.ts               # stripHtml, truncate utilities
├── types/aem.ts                    # TypeScript interfaces for all CF response shapes
└── data/mock/                      # Static JSON fallback (used when AEM is offline)

scripts/
└── ingest-aem-cfs.ts               # CF ingestion: chunk → embed → upsert to pgvector
```

---

## AI RAG Pipeline

Every Content Fragment is chunked by field boundary, embedded with `gemini-embedding-001`, and stored in Supabase pgvector. The chat widget retrieves the top-5 semantically similar chunks per user message and grounds `gemini-3-flash-preview`'s response to those chunks only.

### Chunk types

| CF Model | Chunk type | Path key |
|---|---|---|
| Article | `title_summary` | `{_path}#summary` |
| Article | `body` | `{_path}#body` |
| FAQ | `qa` | `{faq._path}` |
| TutorialStep | `step` | `{step._path}` |
| Author (synthetic) | `author_profile` | `synthetic-author-{slug}#profile` |

### Supabase schema

Run in the Supabase SQL editor (one statement at a time):

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE cf_embeddings (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path       TEXT UNIQUE NOT NULL,
  model      TEXT NOT NULL,
  chunk_type TEXT NOT NULL,
  content    TEXT NOT NULL,
  metadata   JSONB,
  embedding  vector(768),
  synced_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON cf_embeddings USING hnsw (embedding vector_cosine_ops);
```

Then create the retrieval RPC — see `scripts/ingest-aem-cfs.ts` comments for the full `match_cf_chunks` function SQL.

### Running the ingestion script

```bash
# Full sync
npx tsx scripts/ingest-aem-cfs.ts

# Incremental — only articles published after a given date
npx tsx scripts/ingest-aem-cfs.ts --since=2026-04-20T00:00:00Z
```

The script self-loads `.env.local` (tsx does not auto-load it unlike Next.js). AEM must be reachable at `AEM_HOST` when the script runs. For the local demo, start the ngrok tunnel first.

### SEO description write-back

During ingestion, any article missing `khSeoDescription` gets one auto-generated by Gemini and written back to AEM Author via the Sling POST Servlet. To regenerate a single article on demand:

```bash
curl -s -X POST https://YOUR-VERCEL-URL/api/seo-gen \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR-REVALIDATE-SECRET",
    "cfPath": "/content/dam/kh/us/en/articles/your-article-slug",
    "title": "Article Title",
    "body": "Article body text..."
  }'
```

---

## AEM GraphQL Persisted Queries

| Query name | Purpose |
|---|---|
| `knowledge-hub/articles-list` | All articles, sorted by publish date desc |
| `knowledge-hub/articles-by-category` | Articles filtered by `$category: String!` |
| `knowledge-hub/article-by-slug` | Single article by `$slug` |
| `knowledge-hub/faqs-by-category` | FAQs filtered by `$category: String!` |
| `knowledge-hub/tutorials-list` | All tutorials with steps |
| `knowledge-hub/tutorial-by-slug` | Single tutorial by `$slug` |

---

## Local Development

### Prerequisites
- AEM SDK Author running on `localhost:4502`
- ngrok static domain (for Vercel to reach local AEM)
- Node.js 20+, pnpm
- Supabase project with pgvector enabled (connect via Vercel marketplace)

### Setup

```bash
pnpm install
cp .env.example .env.local
# fill in .env.local values
```

**.env.local:**
```
AEM_HOST=https://YOUR-NGROK-DOMAIN.ngrok-free.app
NEXT_PUBLIC_AEM_HOST=https://YOUR-NGROK-DOMAIN.ngrok-free.app
AEM_AUTH=Basic BASE64_OF_ADMIN_COLON_ADMIN
AEM_MOCK_MODE=false
REVALIDATE_SECRET=your-random-secret

# Supabase (from Vercel marketplace integration)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini (embeddings + chat)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

```bash
# Start ngrok tunnel (keep running)
ngrok http 4502 --domain=YOUR-STATIC-DOMAIN.ngrok-free.app

# Start dev server
pnpm dev

# Run CF ingestion (AEM + ngrok must be running)
npx tsx scripts/ingest-aem-cfs.ts
```

### Mock mode (no AEM required)

Set `AEM_MOCK_MODE=true` — the app falls back to static JSON in `src/data/mock/`. Note: the RAG chat widget requires a live Supabase connection regardless of mock mode.

---

## ISR Revalidation

The app uses Next.js ISR with `revalidate = 3600` (1 hour). To trigger immediate revalidation after publishing content in AEM:

```bash
curl -X POST https://YOUR-VERCEL-URL/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR-REVALIDATE-SECRET","paths":["/","/articles","/faqs","/tutorials"]}'
```

Wire this to an AEM Replication Agent to auto-revalidate on publish.

---

## Vercel Deployment

Set these environment variables in the Vercel dashboard:

| Variable | Value |
|---|---|
| `AEM_HOST` | `https://YOUR-NGROK-DOMAIN.ngrok-free.app` |
| `NEXT_PUBLIC_AEM_HOST` | `https://YOUR-NGROK-DOMAIN.ngrok-free.app` |
| `AEM_AUTH` | `Basic BASE64_OF_ADMIN_COLON_ADMIN` |
| `AEM_MOCK_MODE` | `false` |
| `REVALIDATE_SECRET` | random string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (set by Vercel integration) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (set by Vercel integration) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |

---

## Architecture Notes

- **Server Components by default** — all AEM fetches happen server-side; no CORS issues, no auth token exposure
- **Dual-mode client** — automatically falls back to mock JSON if AEM is unreachable (safe for Vercel preview builds when AEM is offline)
- **Lazy Supabase singleton** — `getSupabase()` in `src/lib/supabase.ts` initialises on first call; avoids build-time crash when env vars are absent during static analysis
- **Asymmetric embeddings** — ingestion uses `RETRIEVAL_DOCUMENT` task type; chat uses `RETRIEVAL_QUERY`; both required for correct cosine similarity on asymmetric queries
- **HNSW index dimension limit** — pgvector HNSW caps at 2000 dims; `gemini-embedding-001` is configured to `outputDimensionality: 768`
- **Vercel AI SDK v6** — `useChat` imports from `@ai-sdk/react` (not `ai/react`); `convertToModelMessages` is async; response uses `toUIMessageStreamResponse()`
- **Sling POST Servlet** — SEO write-back uses `POST {cfPath}/jcr:content/data/master` with `application/x-www-form-urlencoded`; the Assets REST API does not support PATCH on CF fields
- **No `generateStaticParams`** — fully dynamic ISR; pages generated on first request then cached
- **`searchParams` and `params` are Promises** in Next.js 15 — must be awaited before use
- **`ngrok-skip-browser-warning` header** — required on all server-side AEM fetch calls to bypass ngrok interstitial
