# SpeedLens Pro ⚡

> Instant dual-device Lighthouse performance audits with AI-generated code fixes — no paid APIs, no rate limits, runs entirely on your machine.

---

## What It Does

Paste any public URL → SpeedLens Pro launches headless Chrome, runs **two sequential Lighthouse audits** (mobile emulation + desktop), detects the site's tech stack, and returns:

- **Mobile & Desktop scores** (0–100) displayed as animated SVG rings
- **Issues** — audits with measurable impact (e.g. "2.4 s" render-blocking delay)
- **AI-generated code fixes** per issue, tailored to the detected framework — powered by Groq
- **Score history sparkline** across every audit run for the same URL
- **PDF export** and **shareable report links**

---

## Features

| Feature | Detail |
|---|---|
| Dual Lighthouse audit | Mobile (default emulation) + Desktop (1350×940, RTT 40ms) per run |
| Animated score rings | SVG circles — green ≥90, amber ≥50, red <50 |
| Tech stack detection | Inspects HTTP headers + HTML — detects Next.js, Nuxt, WordPress, Gatsby, React, Angular, Svelte, Django, Express, PHP |
| AI code fixes | Groq `llama-3.1-8b-instant`, on-demand per issue, in-memory cached, 3-attempt retry |
| Audit history | Last 10 runs per URL stored in MongoDB, rendered as sparkline chart |
| Re-audit | Run a fresh audit from the report page without navigating back |
| PDF export | `window.print()` with dedicated print media styles |
| Share link | Copies report URL to clipboard |

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router) — routing, SSR-ready
- **Tailwind CSS v4** — CSS-first config via `globals.css`
- **Apollo Client 3** — GraphQL mutations & queries
- **React Query 5** — data fetching with caching on the report page
- **Radix UI** — accessible accordion, tabs, progress primitives
- **react-hook-form + Zod 4** — form validation with auto `https://` prepend
- **lucide-react** — icons
- **@graphql-codegen** — auto-generated TypeScript types from schema

### Backend
- **Node.js + Apollo Server 4** — GraphQL API on port 4000
- **Lighthouse 12 + chrome-launcher** — headless Chrome audit engine
- **Groq SDK** — AI fix generation (`llama-3.1-8b-instant`)
- **Mongoose + MongoDB Atlas** — persistent Report & History collections
- **dotenv** — environment variable management

---

## Project Structure

```
speedlens_pro/
├── SPEC.md                         ← Full product specification (as built)
│
├── backend/
│   ├── package.json
│   ├── .env                        ← GROQ_API_KEY, MONGODB_URI (not committed)
│   └── src/
│       ├── index.js                ← Apollo Server entry point (port 4000)
│       ├── db.js                   ← Mongoose connection
│       ├── graphql/
│       │   ├── schema.js           ← GraphQL type definitions
│       │   └── resolvers.js        ← analyzeWebsite, generateFix, getReport, getHistory
│       ├── lighthouse/
│       │   ├── runner.js           ← Dual Chrome + Lighthouse audit
│       │   └── transformer.js      ← lhr → Report (scores, issues, suggestions)
│       ├── ai/
│       │   ├── stack-detector.js   ← Tech stack from HTTP headers + HTML
│       │   └── fix-generator.js    ← Groq AI fix generation (cached, retried)
│       └── models/
│           ├── Report.js           ← Mongoose Report schema
│           └── History.js          ← Mongoose History schema
│
└── frontend/
    ├── package.json
    ├── codegen.ts                  ← GraphQL codegen config
    └── src/
        ├── app/
        │   ├── globals.css         ← Tailwind v4 + custom animations
        │   ├── layout.tsx          ← Root layout: ApolloProvider + ReactQueryProvider
        │   ├── page.tsx            ← Screen 1: hero + URL input form
        │   └── results/
        │       └── [id]/page.tsx   ← Screen 2: report view + history
        ├── components/
        │   ├── UrlForm.tsx         ← URL input, Zod validation, mutation trigger
        │   ├── ReportView.tsx      ← Score rings, issues, suggestions, sparkline
        │   └── ui/                 ← Radix UI primitives
        └── lib/
            ├── apollo-client.ts    ← ApolloClient → http://localhost:4000/graphql
            └── graphql/
                ├── operations.ts   ← GQL operation strings
                └── generated.ts    ← Auto-generated TypeScript types
```

---

## GraphQL API

### Schema overview

```graphql
type Report     { id, url, mobileScore, desktopScore, issues, suggestions, techStack, createdAt }
type Issue      { id, title, description, displayValue, fix }
type Fix        { language, code, explanation }
type Suggestion { id, title, description }
type HistoryEntry { id, mobileScore, desktopScore, createdAt }

Query    { getReport(id), getHistory(url) }
Mutation { analyzeWebsite(url), generateFix(title, description, displayValue, techStack) }
```

### How `analyzeWebsite` works internally

```
Promise.all([
  runLighthouse(url),   ← two sequential Lighthouse runs inside (mobile then desktop)
  detectStack(url),     ← fetch + inspect headers/HTML
])
→ transform lhr → Report
→ save Report + History to MongoDB
→ return Report  (AI fixes are NOT pre-generated — they are on-demand via generateFix)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Google Chrome installed locally
- MongoDB Atlas cluster (free tier works)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/ShivaSS3252/speedlens-pro.git
cd speedlens-pro
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/speedlens
```

Start the server:

```bash
node src/index.js
# → SpeedLens Pro API ready at http://localhost:4000/
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 4. Open the app

Go to [http://localhost:3000](http://localhost:3000), paste any public URL, click **Analyze**.

> First audit takes ~30–45 seconds (Lighthouse runs twice + AI fixes generated).

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | Groq API key for AI fix generation |
| `MONGODB_URI` | `backend/.env` | MongoDB Atlas connection string |

Frontend has no env vars — the GraphQL endpoint is configured in `frontend/src/lib/apollo-client.ts`.

---

## License

MIT
