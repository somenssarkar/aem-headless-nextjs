# AEM Developer Knowledge Hub

A headless content delivery prototype built with **Adobe Experience Manager (AEM) Content Fragments** and **Next.js 15 App Router**, deployed on Vercel.

> Portfolio demo — Phase 3B of the AEM Headless + RAG pipeline project.

---

## What This Is

A developer knowledge portal covering AEM, AEP, and AJO topics. Content is authored as Content Fragments in AEM and delivered headlessly via GraphQL persisted queries to a Next.js frontend.

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
| Deployment | Vercel (free tier) |
| Version control | Git → GitHub |

---

## Content Fragment Models

| Model | Key fields |
|---|---|
| **Article** | khTitle, khSlug, khCategory (enum), khDifficulty (enum), khBody (rich text), khAuthor (fragment ref), khRelatedFAQs (multi fragment ref) |
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
│   ├── page.tsx               # Homepage — latest 6 articles + category browse
│   ├── articles/
│   │   ├── page.tsx           # Article listing with category filter
│   │   └── [slug]/page.tsx    # Article detail
│   ├── faqs/page.tsx          # FAQs grouped by category with accordion
│   ├── tutorials/
│   │   ├── page.tsx           # Tutorial listing
│   │   └── [slug]/page.tsx    # Tutorial detail with step-by-step layout
│   └── api/revalidate/route.ts # ISR webhook for AEM replication events
├── components/
│   ├── ArticleCard.tsx
│   ├── ArticleDetail.tsx
│   ├── FAQAccordion.tsx       # Client component with useState
│   ├── TutorialSteps.tsx
│   └── AuthorBio.tsx
├── lib/
│   ├── aem-client.ts          # Dual-mode: real AEM or static mock fallback
│   ├── queries.ts             # GraphQL persisted query names + CATEGORIES constant
│   └── html-utils.ts          # stripHtml, truncate utilities
├── types/aem.ts               # TypeScript interfaces for all CF response shapes
└── data/mock/                 # Static JSON fallback (used when AEM is offline)
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
```

```bash
# Start ngrok tunnel (keep running)
ngrok http 4502 --domain=YOUR-STATIC-DOMAIN.ngrok-free.app

# Start dev server
pnpm dev
```

### Mock mode (no AEM required)

Set `AEM_MOCK_MODE=true` — the app falls back to static JSON in `src/data/mock/`.

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

---

## Architecture Notes

- **Server Components by default** — all AEM fetches happen server-side; no CORS issues, no auth token exposure
- **Dual-mode client** — automatically falls back to mock JSON if AEM is unreachable (safe for Vercel preview builds when AEM is offline)
- **No `generateStaticParams`** — fully dynamic ISR; pages generated on first request then cached
- **`searchParams` and `params` are Promises** in Next.js 15 — must be awaited before use
- **`ngrok-skip-browser-warning` header** — required on all server-side AEM fetch calls to bypass ngrok interstitial
