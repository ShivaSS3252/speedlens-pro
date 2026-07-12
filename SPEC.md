# SpeedLens Pro — Product Specification (As Built)

---

## 1. Product Overview

SpeedLens Pro is a web application that lets you paste any public website URL and receive a
dual performance audit (mobile + desktop) powered by Google Lighthouse running locally on the
server. AI-generated code fixes are produced via Groq (llama-3.1-8b-instant). Results are
persisted to MongoDB so audit history is tracked per URL.

**Target users:** Frontend developers who want a quick, actionable performance snapshot
without leaving their workflow.

**Key constraints:** No paid audit APIs, no quotas — Lighthouse runs locally via headless Chrome.

---

## 2. Features

| # | Feature |
|---|---------|
| 1 | Enter a URL to analyze (Zod-validated, auto-prepends https://) |
| 2 | Dual Lighthouse audit — separate mobile and desktop runs |
| 3 | View mobile + desktop performance scores (0–100, animated SVG rings) |
| 4 | Tech stack detection from HTTP headers + HTML content |
| 5 | View detected issues with measured impact (displayValue) |
| 6 | AI-generated code fixes per issue via Groq (on demand, cached) |
| 7 | View suggestions (informational, no displayValue) |
| 8 | Audit history — last 10 audits per URL, sparkline chart |
| 9 | Re-audit same URL without returning to home |
| 10 | Export report as PDF (window.print with print media styles) |
| 11 | Share link (copy report URL to clipboard) |

---

## 3. User Flow

```
1. User opens the app (Screen 1 — home page)
2. User types or pastes a URL into the input field
3. User clicks "Analyze"
4. Loading state: "Running Lighthouse on mobile & desktop + generating AI fixes. Up to 45 sec."
5. Backend: Chrome launches + tech stack detection run in parallel →
           two sequential Lighthouse runs (mobile, desktop) →
           Report + History saved to MongoDB
           (AI fixes are generated on-demand later, not during analyzeWebsite)
6. App navigates to /results/{id} (Screen 2)
7. User sees: mobile score, desktop score, tech stack badge, issues list, suggestions list,
              history sparkline (if ≥2 audits exist for this URL)
8. User clicks "⚡ Fix It" on any issue → AI code snippet loads inline
9. User can ↺ Re-audit, ↓ Export PDF, or ⎘ Share Link
```

---

## 4. UI Specification

### Screen 1 — Home Page

- Dark background with blue/orange decorative gradient blobs
- Animated badge: "Powered by Lighthouse 12 + Groq AI"
- Hero headline: "SpeedLens Pro" with gradient text
- Stats row: "2× Audits per run", "AI Code fixes", "0 External APIs"
- Centered UrlForm component
- "Try examples" pills: github.com, vercel.com, nextjs.org

### Screen 2 — Report (`/results/[id]`)

- **Header:** Tech stack badge, URL, action buttons (Re-audit / Export PDF / Share)
- **Score rings:** Two animated SVG circles side-by-side (Mobile / Desktop)
  - Green ≥ 90 ("Good"), Amber ≥ 50 ("Needs Work"), Red < 50 ("Poor")
  - Ring glow filter; smooth stroke-dashoffset animation
- **History sparkline:** Line chart (mobile = blue, desktop = orange) if ≥ 2 audits found
- **Issues accordion:** Title + description per item; "⚡ Fix It" button (shows "↺ Retry Fix" on failure)
  - `displayValue` is NOT rendered — it is only sent as context to the AI fix generator
  - On click: GENERATE_FIX mutation → inline FixBlock (language, code, copy button, explanation)
- **Suggestions accordion:** Title + description, read-only
- **Skeleton loading state** while data fetches
- **Error state:** "Report not found" with link back to home
- **Print media styles:** hides buttons, removes shadows, black text on white background

---

## 5. Data Model

### MongoDB Collections

**Report**
```
{
  id:           String (UUID, unique)
  url:          String
  mobileScore:  Number (0–100)
  desktopScore: Number (0–100)
  issues: [{
    id:           String
    title:        String
    description:  String
    displayValue: String?
    fix: {
      language:    String
      code:        String
      explanation: String
    }?
  }]
  suggestions: [{
    id:          String
    title:       String
    description: String
  }]
  techStack: String
  createdAt: String (ISO 8601)
}
```

**History** (one record per audit, keyed by url for sparkline queries)
```
{
  id:           String (matches Report.id)
  url:          String
  mobileScore:  Number
  desktopScore: Number
  createdAt:    String (ISO 8601)
}
```

---

## 6. GraphQL API

### Schema

```graphql
type Fix {
  language:    String
  code:        String
  explanation: String
}

type Issue {
  id:           ID!
  title:        String!
  description:  String!
  displayValue: String
  fix:          Fix
}

type Suggestion {
  id:          ID!
  title:       String!
  description: String!
}

type HistoryEntry {
  id:           ID!
  mobileScore:  Int!
  desktopScore: Int!
  createdAt:    String!
}

type Report {
  id:           ID!
  url:          String!
  mobileScore:  Int!
  desktopScore: Int!
  issues:       [Issue!]!
  suggestions:  [Suggestion!]!
  techStack:    String
  createdAt:    String!
}

type Query {
  getReport(id: ID!): Report
  getHistory(url: String!): [HistoryEntry!]!
}

type Mutation {
  analyzeWebsite(url: String!): Report!
  generateFix(
    title:        String!
    description:  String!
    displayValue: String
    techStack:    String!
  ): Fix
}
```

### Key Operations

**Analyze a URL:**
```graphql
mutation AnalyzeWebsite($url: String!) {
  analyzeWebsite(url: $url) {
    id url mobileScore desktopScore techStack createdAt
    issues      { id title description displayValue }
    suggestions { id title description }
  }
}
```

**Fetch a saved report:**
```graphql
query GetReport($id: ID!) {
  getReport(id: $id) {
    id url mobileScore desktopScore techStack createdAt
    issues      { id title description displayValue }
    suggestions { id title description }
  }
}
```

**Generate an AI fix on demand:**
```graphql
mutation GenerateFix($title: String!, $description: String!, $displayValue: String, $techStack: String!) {
  generateFix(title: $title, description: $description, displayValue: $displayValue, techStack: $techStack) {
    language code explanation
  }
}
```

**Fetch audit history for a URL:**
```graphql
query GetHistory($url: String!) {
  getHistory(url: $url) {
    id mobileScore desktopScore createdAt
  }
}
```

---

## 7. Backend Architecture

### Framework
- **NestJS 10** with **Fastify** HTTP adapter (`@nestjs/platform-fastify`)
- **Schema-first GraphQL** via `@nestjs/graphql` + `@nestjs/apollo` (Apollo Server 4 under the hood)
- **@nestjs/mongoose** for MongoDB/Mongoose integration
- **@nestjs/config** for `.env` loading (GROQ_API_KEY, MONGODB_URI)
- CORS configured via `@fastify/cors`; origins from `CORS_ORIGIN` env var (comma-separated)
- Server listens on port 4000; GraphQL endpoint at `/graphql`

### Module Structure

| Module | Providers | Responsibility |
|---|---|---|
| `AppModule` | — | Root: wires GraphQL, Mongoose, Config, all feature modules |
| `ReportModule` | `ReportResolver`, `ReportService` | GraphQL entry point + orchestration |
| `HistoryModule` | `HistoryService` | MongoDB History CRUD |
| `LighthouseModule` | `LighthouseService` | Chrome audit + lhr transform |
| `AiModule` | `StackDetectorService`, `FixGeneratorService` | Stack detection + Groq fix generation |

### Lighthouse Pipeline

**`src/lighthouse/lighthouse.service.ts`** — `run(url)` method
1. `chrome-launcher` spawns headless Chromium (flags: `--headless`, `--no-sandbox`, `--disable-gpu`, `--disable-dev-shm-usage`, `--no-zygote`, `--disable-extensions`, `--disable-plugins`, `--disable-background-networking`, `--disable-default-apps`, `--mute-audio`)
2. Lighthouse runs mobile audit (default emulation)
3. Second run with desktop settings: `formFactor: 'desktop'`, 1350×940 viewport, RTT 40ms, 10240 kbps throughput, CPU slowdown ×1
4. Chrome killed in `finally` block; returns `{ mobile: lhr, desktop: lhr }`

**`transform(url, { mobile, desktop })`** method on same service
- Extracts `mobileScore` / `desktopScore` (`categories.performance.score * 100`)
- Merges failing audits from both runs, deduplicated by audit id
- Classifies as Issue if audit has `displayValue` or `details`; otherwise Suggestion
- Strips markdown from descriptions; generates UUID for report id

### AI Layer

**`src/ai/stack-detector.service.ts`** — `detect(url)` method
- Fetches URL with 6 s timeout
- Inspects `x-powered-by`, `x-generator`, `server` headers + HTML content
- Returns one of: Next.js, Nuxt.js, WordPress, Gatsby, React, Angular, Svelte, Django, Node.js/Express, PHP, HTML/CSS/JS
- Falls back to `HTML/CSS/JS` on any error

**`src/ai/fix-generator.service.ts`** — `generate(issue, techStack)` method
- Groq client: `llama-3.1-8b-instant`, max 400 tokens, temperature 0.3
- System prompt enforces JSON-only output: `{ language, code, explanation }`
- In-memory `Map` cache keyed by `"title::techStack"` — same issue never sent to Groq twice
- Two retry paths (up to 3 total attempts):
  - JSON parse failure: sleeps 800 ms before each retry
  - API call throws: sleeps 1000 ms before attempt 2, 2000 ms before attempt 3
- Returns `null` if all retries exhausted

### Resolver / Service Logic

**`ReportResolver`** (`src/report/report.resolver.ts`) — maps GraphQL operations to `ReportService`

**`ReportService.analyzeWebsite(url)`**
1. `Promise.all([lighthouseService.run(url), stackDetectorService.detect(url)])` — parallel
2. `lighthouseService.transform(url, lhrs)` → Report object (scores, issues, suggestions, UUID)
3. Attach techStack + createdAt (ISO timestamp)
4. Save `Report` doc to MongoDB
5. Save `History` doc to MongoDB
6. Return Report (AI fixes are on-demand via `generateFix`, not pre-generated here)

**`generateFix`** — delegates to `FixGeneratorService.generate()`; cache-first

**`getReport`** — `Report.findOne({ id })` via `ReportService.findById()`

**`getHistory`** — `History.find({ url }).sort({ createdAt: -1 }).limit(10)` via `HistoryService.findByUrl()`

---

## 8. Frontend Architecture

### Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 (CSS-first config via `globals.css @theme`) |
| GraphQL client | Apollo Client 3 + React Query 5 |
| UI primitives | Radix UI (accordion, progress, tabs, slot) |
| Forms | react-hook-form + Zod 4 |
| Icons | lucide-react |
| Types | @graphql-codegen (auto-generated from schema) |

### Routing

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `app/page.tsx` | Screen 1 — hero + URL input |
| `/results/[id]` | `app/results/[id]/page.tsx` | Screen 2 — report view |
| `/results` | `app/results/page.tsx` | Fallback (no id provided) |

### Key Components

**`UrlForm.tsx`**
- Zod: URL required, max 500 chars, auto-prepends `https://`, validates format
- `useMutation(ANALYZE_WEBSITE)` → on complete, `router.push(/results/{id})`
- Disabled + spinner during loading; error banner on failure

**`ReportView.tsx`**
- Score rings: animated SVG circles with glow filter
- Sparkline chart: conditional (history.length ≥ 2), blue = mobile, orange = desktop
- Issue accordion: "⚡ Fix It" per item → `useMutation(GENERATE_FIX)` → inline FixBlock
- FixBlock: code with language label, one-click copy, explanation text
- Suggestion accordion: read-only

**`app/results/[id]/page.tsx`**
- Uses **React Query's `useQuery`** (not Apollo's hook) — calls `client.query()` manually inside `queryFn`
- `GET_REPORT` fetched with `fetchPolicy: 'network-only'` via React Query
- `GET_HISTORY` query enabled only once `report?.url` resolves
- `useMutation(ANALYZE_WEBSITE)` (Apollo) for re-audit; navigates to new `/results/{id}` on complete
- Passes `report`, `history`, `onReaudit`, `reauditLoading`, `onExportPdf` props to `ReportView`
- Skeleton loading state (logo, two score circles, 3 issue placeholders); error card with "← Analyze a URL" link

### Apollo Client (`lib/apollo-client.ts`)
```ts
new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:4000/graphql" }),
  cache: new InMemoryCache(),
})
```

---

## 9. Environment Configuration

### Backend `.env`
```
GROQ_API_KEY=<groq api key>
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.r0rbr.mongodb.net/speedlens
```

### Frontend
No `.env` required. GraphQL endpoint hardcoded in `lib/apollo-client.ts` as `http://localhost:4000/graphql`.

---

## 10. Folder Structure

```
speedlens_pro/
├── SPEC.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── Dockerfile
│   ├── .env                              ← GROQ_API_KEY, MONGODB_URI
│   └── src/
│       ├── main.ts                       ← NestJS bootstrap, Fastify adapter, port 4000
│       ├── app.module.ts                 ← Root module (GraphQL, Mongoose, Config)
│       ├── schema.graphql                ← GraphQL type definitions (schema-first)
│       ├── report/
│       │   ├── report.module.ts
│       │   ├── report.resolver.ts        ← analyzeWebsite, generateFix, getReport, getHistory
│       │   ├── report.service.ts         ← Business logic, Promise.all orchestration
│       │   └── report.schema.ts          ← Mongoose Report schema
│       ├── history/
│       │   ├── history.module.ts
│       │   ├── history.service.ts        ← findByUrl, create
│       │   └── history.schema.ts         ← Mongoose History schema
│       ├── lighthouse/
│       │   ├── lighthouse.module.ts
│       │   └── lighthouse.service.ts     ← Dual Chrome+Lighthouse audit + lhr transformer
│       └── ai/
│           ├── ai.module.ts
│           ├── stack-detector.service.ts ← Tech stack from HTTP headers + HTML
│           └── fix-generator.service.ts  ← Groq AI fix generation (cached, retried)
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    ├── codegen.ts                    ← GraphQL codegen config
    └── src/
        ├── app/
        │   ├── globals.css           ← Tailwind v4 + custom animations
        │   ├── layout.tsx            ← Root layout: ApolloProvider + ReactQueryProvider
        │   ├── page.tsx              ← Screen 1: hero + UrlForm
        │   └── results/
        │       ├── page.tsx          ← Fallback (no id)
        │       └── [id]/page.tsx     ← Screen 2: report + history
        ├── components/
        │   ├── UrlForm.tsx           ← URL input, Zod validation, mutation trigger
        │   ├── ReportView.tsx        ← Scores, issues, suggestions, sparkline, fix generation
        │   └── ui/                   ← Radix UI primitives (accordion, button, card, …)
        └── lib/
            ├── apollo-client.ts      ← ApolloClient → http://localhost:4000/graphql
            ├── utils.ts              ← cn() (clsx + twMerge)
            └── graphql/
                ├── operations.ts     ← GQL operation strings
                └── generated.ts      ← Auto-generated TypeScript types (codegen)
```
