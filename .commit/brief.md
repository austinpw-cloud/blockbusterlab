# Core Intent
PROBLEM: Indie game studios ship to the App Store / Google Play without ASO expertise — this service ingests a store URL, analyses it against a curated 90-game reference library, and returns a Korean ASO playbook plus screenshot guidance/overlay assets the developer can ship.
FEATURES:
- Stage 8 ASO analysis: scrape store metadata + competitors → run a Claude-Opus pipeline that consults a 13-axis reference library and emits a hard-rule-validated ASO playbook (~$2.5 / order)
- Stage 9 screenshot pipeline: judge uploaded materials → either return a Korean upload guide (insufficient) or generate overlay-only assets composited over the developer's screenshots (sufficient/partial)
- Admin backoffice (6 menus: orders / deliverables / library / customers / stats / settings) with Supabase magic-link auth, admin_users allowlist, and a TEST_CUSTOMER_EMAILS whitelist that excludes internal traffic from operational stats
TARGET_USER: Korean indie game studios (initial wedge: Lunosoft and Indiegame.com partner studios) shipping mobile titles who have store listings but no in-house ASO function.

# Stack Fingerprint
RUNTIME: Node 20 + TypeScript 5 (per .github/workflows/ci.yml + package.json)
FRONTEND: Next.js 16.2.3 (App Router) + React 19.2 + Tailwind 4 + framer-motion 12
BACKEND: Next.js Route Handlers on Vercel Serverless (Hobby, maxDuration ≤ 300s) + Supabase Postgres; no separate server
DATABASE: Supabase Postgres · 11 tables across migrations 001–008 (reference_games, reference_screenshots, genre_playbooks, customers, admin_users, orders, order_files, deliverables, revision_requests, aso_benchmarks, library_patterns) · RLS present in migrations
INFRA: Vercel (Root Directory `website`, Hobby plan) · GitHub Actions CI (tsc --noEmit + next build with dummy env) · GoDaddy domain blockbusterlab.com · auto-deploy on push to main
AI_LAYER: LLM-based ASO analysis (Claude Opus for Stage 8 + L2/L3 pattern synthesis, Sonnet+Vision for L1 icon/text/screenshot tagging, used as Stage 9 judge + overlay designer); no AI image generation by policy — overlays only
EXTERNAL_API: Anthropic Messages API · google-play-scraper (Play Store metadata + reviews) · custom Apple App Store scraper · puppeteer (composite rendering) · sharp (image metadata)
AUTH: Supabase Auth magic link + admin_users table allowlist (auto-binds auth_user_id on first login); customer-facing apply flow is unauthenticated
SPECIAL: Reference Library v2 — 3-layer model (observations → patterns → insights) with axis_key fallback chain (specific_4axis → genre_market_monetization → genre_market → genre_only); Stage 9 reference images stripped from Vision payloads after a 1.85GB→~50MB storage cost discovery (JSON-only context now); customer-facing surfaces are forbidden from mentioning "AI" (project policy)

# Failure Log

## Failure 1
SYMPTOM: Dev API routes for the L1–L3 reference-library pipeline and Stage 8 runner had `maxDuration` set to 800s and 600s — they would deploy fine but every long run silently truncated, because the Vercel function killed them at 5 minutes.
CAUSE: Vercel Hobby plan caps Serverless Function maxDuration at 300s. The values were copied from notes that assumed a Pro-plan ceiling; the platform limit was not encoded anywhere in the repo.
FIX: Commit b6c7b9e capped every dev route at 300, and the Library pipeline was redesigned to be resumable level-by-level (orchestrator.ts) so a single L1/L2/L3 step fits inside 5 minutes.
PREVENTION: Saved as a project-level memory ("Vercel Hobby 운영 함정 — maxDuration 300s, Root Dir `website`") so future routes default to 300; production Stage 8 single-runs are explicitly engineered to stay under 5 min.

## Failure 2
SYMPTOM: An /api/dev/inspect-orders admin endpoint queried a table called `aso_analyses` that did not exist in the schema — every call 500'd. Around the same series of commits, screenshot generation broke the TypeScript build because `runScreenshotProductionBranch` still referenced a `referenceImages` array after the upstream code removed Vision-based reference attachments.
CAUSE: Mid-refactor renames (analyses → `deliverables`, removal of reference-image Vision payload) — the AI confidently produced new code paths but missed dangling references at call sites and in admin tooling. Both bugs survived local checks because the broken paths weren't on the run path being tested.
FIX: Commit 40d0403 repointed inspect-orders at `deliverables`; commit e096664 passed an explicit empty array for the removed `referenceImages` parameter so the build compiles. Both were one-line follow-ups after the original refactor shipped.
PREVENTION: Added GitHub Actions CI (commit fb48253) that runs `tsc --noEmit` + `next build` on every push and PR with dummy env vars — the second class of breakage (TS dangling refs) now blocks merge instead of being caught after deploy.

# Decision Archaeology

## Decision 1
ORIGINAL_PLAN: Stage 9 generates full marketing screenshots end-to-end (background art included) with an image model.
REASON_TO_CHANGE: Two converging pressures — (a) a hard product policy that AI must not draw the game itself (it has to be the developer's actual game capture), and (b) cost/quality data showing AI-drawn backgrounds were unusable. Saved in memory as "스크린샷 생성 아키텍처 — 게임 캡처 + 오버레이 구조, AI가 이미지 그리면 안 됨".
FINAL_CHOICE: Evaluate-then-branch (commit a41ef34): a Judge step rates uploaded materials, then either returns a Korean upload guide (insufficient) or generates overlay layers only and composites them over the developer's own screenshots via Puppeteer + sharp.
OUTCOME: Net positive — the deliverable is now visually grounded in the actual game, customers without good captures get an actionable guide instead of a hallucinated screenshot, and Storage cost dropped (1.85GB → ~50MB after the related Vision-payload cleanup). Trade-off: Stage 9 has two separate output shapes the admin UI now has to render.

## Decision 2
ORIGINAL_PLAN: Switch Stage 8 (the main per-order ASO analyser) from Claude Opus to Sonnet to cut per-order cost roughly 5×.
REASON_TO_CHANGE: A side-by-side run on the test order ("쓰레기왕" / com.lunosoft.trash) was done — v2 Opus vs v3 Sonnet (commit 809c833). Sonnet's playbook lost specificity on creative phrasing and reference-pattern synthesis; the cost saving did not justify the quality drop for a paid deliverable.
FINAL_CHOICE: Kept Opus for Stage 8; introduced a `model` option on `aso-analyzer.ts` with per-model pricing branches so future Sonnet runs are still cheap to A/B. Per-order cost stays at ~$2.5.
OUTCOME: Right call given the service is sold as a finished playbook, not a draft — but it leaves the unit economics tight on Hobby/Vercel pricing, and there is no fallback if Opus latency spikes.

# AI Delegation Map

| Domain | AI % | Human % | Notes |
|--------|------|---------|-------|
| Supabase schema (migrations 001–008) | 60 | 40 | AI drafted DDL + RLS; human chose tables, made the 005/006/008 refactors (library_patterns split, axis tagging, comment update) |
| Reference Library v2 design (3-layer, axis_key fallback) | 35 | 65 | Architecture and curation rules came from human (docs/12-library-analysis-design.md, ASO bible); AI implemented orchestrator/curate/tag-game |
| Stage 8 ASO analyzer + prompts | 50 | 50 | Prompt scaffolding AI-written, then heavily edited by human ("실증 자료 강제 활용" rules in 809c833, hard-rule validator added by human direction) |
| Stage 9 screenshot pipeline (judge / overlay / composite) | 70 | 30 | AI wrote judge-materials, overlay-design, composite-renderer; human set the evaluate-then-branch policy and the no-AI-imagery constraint |
| Admin backoffice UI (orders/deliverables/library/customers/stats/settings) | 80 | 20 | Largely AI-generated React/server components; human directed scope (6-menu nav, test-data whitelist, mailto-only CTAs) |
| Auth (Supabase magic link + admin_users binding) | 65 | 35 | AI implemented the auth helper + auto-bind logic; human set the allowlist model and seeded admin_users |
| Scraper (Google Play / Apple App Store / reviews / hi-res) | 75 | 25 | AI wrote nearly all of `lib/scraper/*`; human picked the libraries and patched review-sort quirks |
| CI / deploy hardening | 45 | 55 | Human discovered the Vercel Hobby 300s cap and the `website` Root Dir trap; AI wrote the workflow YAML and applied the fix commits |
| Operations / test-data isolation | 30 | 70 | Whitelist + isTestEmail logic was a human-driven response to real test traffic mixing into stats; AI implemented the helper |
| Documentation (docs/aso/, docs/02-current-state.md, README) | 55 | 45 | AI drafted skeletons; human owns the ASO knowledge base content and decides what is canonical |

# Live Proof
DEPLOYED_URL: https://blockbusterlab.com (claimed in README; not independently verified in this session)
GITHUB_URL: https://github.com/austinpw-cloud/blockbusterlab
API_ENDPOINTS: /api/orders, /api/admin/auth/* (admin-gated), /api/dev/* (dev-only) — none are public read endpoints
CONTRACT_ADDRESSES: ?
OTHER_EVIDENCE: Reference library claims 90 games / 13 axes (per memory + docs); 5 known test-customer emails in TEST_CUSTOMER_EMAILS; no real-customer count verified from code; no demo video or screenshots in repo; one validated end-to-end test order ("쓰레기왕" / com.lunosoft.trash).

# Next Blocker
CURRENT_BLOCKER: knowledge — the Stage 8 + Stage 9 pipeline has only been pressure-tested on one real game (Lunosoft 쓰레기왕 v1/v2/v3) plus internal form-validation traffic. The hard-rule validator (`validate-aso-output.ts`) and the axis_key fallback chain are unproven against genre diversity (puzzle/RPG/casual/hyper-casual), and there is no real paying customer order in the system yet to validate that the Korean playbook is shippable as-is.
FIRST_AI_TASK: Build a `/api/dev/run-stage8-batch` route that takes a JSON list of {storeUrl, genre} entries (seed it with the 6 Lunosoft URLs from the project memory), runs Stage 8 against each, and writes a single Markdown comparison report covering: (1) which axis_key path was hit, (2) which hard rules in `validate-aso-output.ts` fired, (3) per-order cost from `_meta`, and (4) a side-by-side of the top-3 keyword recommendations vs. the current store metadata — so the human reviewer can decide in one pass whether the analyser generalises beyond the trash-king test order.

# Integrity Self-Check
PROMPT_VERSION: commit-brief/v1.3
VERIFIED_CLAIMS:
- Next.js 16.2.3, React 19.2.4, TypeScript ^5, Anthropic SDK ^0.88.0, google-play-scraper ^10.1.2, puppeteer ^24.40.0, sharp ^0.34.5 (transitive lockfile entry), framer-motion, zod — `website/package.json`, `website/package-lock.json`
- 8 migration files (001–008) and 11 CREATE TABLE statements — `website/supabase/migrations/`
- Vercel Hobby maxDuration cap fix (800/600 → 300) — commit b6c7b9e
- TS build break from leftover `referenceImages` reference — commit e096664, `website/src/lib/screenshot/generate.ts`
- inspect-orders pointed at non-existent `aso_analyses` → switched to `deliverables` — commit 40d0403
- Reference Library v2 design (3 layers, L1 Sonnet+Vision, L2/L3 Opus) and Stage 9 evaluate-then-branch — commit a41ef34, `website/src/lib/reference-library/`, `website/src/lib/screenshot/`
- Stage 8 Opus-vs-Sonnet decision and "실증 자료 강제 활용" prompt rules — commit 809c833
- Test-customer whitelist (5 emails, isTestEmail helper) — commit 957947b, `website/src/lib/admin/test-data.ts`
- Admin 6-menu nav (orders/deliverables/library/customers/stats/settings) — `website/src/app/admin/(auth)/`
- GitHub Actions CI runs tsc --noEmit + next build with dummy env — `.github/workflows/ci.yml`, commit fb48253
- Magic-link admin auth + admin_users binding — `website/src/lib/auth/admin.ts`, `website/src/app/admin/login/page.tsx`
- Anthropic model IDs claude-opus-4-6 / claude-sonnet-4-6 / claude-haiku-4-5-20251001 in `website/src/lib/ai/models.ts`
UNVERIFIABLE_CLAIMS:
- That blockbusterlab.com is currently serving traffic (README claims it; not fetched in this session)
- "90 reference games / 13 axes" — claimed in README and memory but I did not run a count query against the live DB
- "~$2.5 per order" — token-cost estimate, not measured against a live invoice
- Resend email integration — `RESEND_API_KEY` is referenced in env files but no `resend` package import or send call exists in the codebase, so email delivery is currently `mailto:` links only despite README listing Resend in infra
- Whether GitHub Actions runs are actually passing on `main` (the workflow file exists; I did not check `gh run list`)
- Whether the Lunosoft test order produced a customer-acceptable deliverable — that's a qualitative judgement made by the human, not visible in code
DIVERGENCES:
- README lists Resend as part of infra; code has no Resend integration. I treated Resend as "env-configured, not wired" rather than parroting the README claim.
- Project memory says "운영 진입 완료 (2026-04-29)" but the repo has no real-customer orders visible — only test-data emails. The brief reflects code state, not the optimistic memory note.
- The user's prompt asked me not to mention which AI tool was used to build the project; I followed that and did not name the coding assistant in any answer.
- No template sections were removed or biased; the user did not steer answers during this run.
CONFIDENCE_SCORE: 7 — stack, schema, commit-level failures, decisions, and delegation are grounded in files I read this session. Numbers like "$2.5/order", "90 games", and the deployment status are repeated from README/memory rather than re-measured, and the AI/Human percentage split is an informed estimate, not a measurement.
