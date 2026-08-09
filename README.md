# MCQure

An AI-powered competitive-exam prep platform. Phase 1 (foundation): exam-agnostic
MCQ practice with database-driven scoring, authenticated sessions, honest question
provenance, and a Practice → Analytics → Study → Motivation loop as the roadmap.

Target exam (configurable, not hard-coded): **DSSSB TGT Computer Science**.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 (dark/light mode)
- PostgreSQL 18 (embedded binaries, no install required), Prisma ORM
- Zod validation, `jose` (JWT sessions), `bcryptjs` (password hashing)
- Vitest for unit/DB tests

## Getting started

```bash
npm install
npm run db:ensure   # starts local PostgreSQL (first run creates the cluster)
npx prisma migrate deploy   # apply migrations
npm run db:seed     # idempotent seed: DSSSB exam + syllabus + 80 AI MCQs
npm run dev         # http://localhost:3000
```

Environment (see `.env.example`):

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/mcqure"
AUTH_SECRET="<random 32+ char string>"

# Optional AI providers — leave as placeholders until you have real keys.
GEMINI_API_KEY=your_actual_key
TAVILY_API_KEY=your_actual_key
OPENROUTER_API_KEY=your_actual_key
```

After changing `.env`, restart the dev server (`npm run dev`). The AI keys are
optional: the app runs fine without them and `/api/ai/status` (plus the homepage
badge) reports which providers are live. When you paste real keys, the client
layer in `src/lib/ai.ts` (Gemini generation, Tavily search, OpenRouter chat) is
ready to be used by upcoming phases.

## Database

Local PostgreSQL runs from `@embedded-postgres/windows-x64` binaries, driven by
`scripts/db.mjs` so the server daemonizes independently of the script. The data
cluster lives in `.data/postgres` (git-ignored) on port **5433**.

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run db:status` | Show whether postgres is running |
| `npm run db:start` / `db:stop` / `db:restart` | Lifecycle |
| `npm run db:wipe` | Remove the cluster (stop it first if running) |
| `npm run db:migrate` | Create a migration (`prisma migrate dev`) |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:seed` | (Re)seed exam, syllabus, questions |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Note: `prisma migrate dev` requires an interactive terminal; in non-interactive
shells create migrations manually and apply them with `npm run db:deploy`.

## What works in Phase 1

- **Auth**: register, login, logout, `/api/auth/me`; httpOnly JWT cookie
  (`mcqure_session`, HS256, 7-day expiry); bcrypt cost 12; rate-limited auth routes.
- **Exam config**: `Exam`, `ScoringConfig`, `Subject`/`Topic`/`Subtopic` are seed
  data — scoring (+1 correct, −0.25 wrong, 0 skipped, total 200) is read from the
  DB, never hard-coded. A new exam = new seed rows, not code changes.
- **Question bank**: 80 original AI-generated MCQs across the DSSSB TGT CS
  syllabus, all linked to a `QuestionSource` of type `AI_GENERATED`. No PYQs are
  fabricated.
- **Practice**: quick (10) / standard (25) / deep (50) / marathon (100) / custom
  (subject, topic, difficulty, source, count, time limit). Sessions snapshot the
  questions at start time, resume after reload, and answer → feedback flow is
  one question at a time.
- **Scoring engine**: deterministic, config-driven; attempts are **immutable**
  (unique `(user, question, session)` — re-answering returns 409).
- **Analytics primitives**: accuracy, net score, avg/median time, confidence
  buckets, current/best streak, weakest-topic detection.
- **Analytics dashboard**: `/analytics` — 14-day net-score trend, per-subject
  accuracy chart, topic strength (weakest first), error-type distribution,
  confidence analysis and the mistake book with one-click review.
- **Study module**: `/study` — concise concept notes, mnemonics, exam traps and
  comparison tables for every topic (197 notes), a one-page revision summary
  per topic, weak-topic "priority revision" driven by your analytics, and
  one-click topic practice.
- **PYQ bank**: `/pyq` — browse and submit genuine previous-year questions with
  mandatory source disclosure and a verification workflow (UNVERIFIED → PENDING
  → VERIFIED / CONFLICT), year filtering, and an honest empty state. No authentic
  papers are bundled yet, so the bank ships empty by design and is filled only
  from real paper copies.
- **Preparation & tracking**: `/preparation` — the central data layer. A data-driven
  exam blueprint (paper → sections → subject distribution → per-topic weights marked
  `OFFICIAL`/`ESTIMATED`/`UNKNOWN` with a stated basis) seeded for DSSSB; a persistent
  `UserPreparation` profile ("My Target Exam"); per-subject/topic performance with
  mastery (Bayesian-smoothed, never 100% from a tiny sample), five completion states
  (Not started → Studying → Practiced → Proficient → Mastered), subtopic/concept
  breakdown, strengths/weaknesses, revision queue, daily evidence-based plan, syllabus
  coverage (studied ≠ mastered), exam-alignment score, personal bests and trends.
  `StudyVisit` records when material/revision was opened so "last revised" stays truthful.
- **Large question bank (architecture)**: every question is classified exactly one of
  `PYQ` / `OFFICIAL` / `LICENSED` / `PYQ_VARIANT` / `AI_GENERATED` /
  `WEB_DERIVED_ORIGINAL` / `WEB_SOURCED` / `USER_CREATED`, each with a distinct badge
  (a generated question can never render as a genuine PYQ). `createQuestion` is the
  single guarded insertion point: exact-duplicate fingerprint check (indexed), bounded
  near-duplicate n-gram scan, and a quality gate (`APPROVED`/`QUARANTINED`/`REJECTED`;
  rejected questions are not inserted and never reach practice). Per-question running
  stats (`timesAttempted/Correct/Incorrect/Skipped`, avg response time, report count)
  update transactionally with each immutable attempt and feed the adaptive engine.
  `/api/questions` GET is a cursor-paginated, server-side-filtered explorer
  (exam/section/subject/topic/subtopic/concept/difficulty/source/verification/quality/
  relevance/search) with a trigram GIN index for search; `/questions` is its UI.
  `IngestionJob` tracks progressive import/generation batches, and the Gemini-backed
  generation service (`src/lib/generation.ts`) produces labelled originals/variants
  that go through the same dedup + quality gates. Still to come: embedding-based
  semantic dedup and offline batch pipelines for the 1M scale.
- **Roadmap pages**: Motivation (Phase 6) is an honest roadmap page so nothing
  is faked ahead of its phase.

## Integrity rules

- AI-generated questions are **never** labeled as real PYQs. Every question
  carries a disclosed `source`; `QuestionSource.verified` is surfaced in feedback.
- A `Pyq` table exists for real previous-year questions, to be filled only from
  authenticated paper copies with verification status tracked.
- Users can flag a question as wrong via `/api/questions/report`.
- Sources are never fabricated: a `VERIFIED PYQ` badge only appears when provenance
  was actually checked; disagreements mark the question for review instead of guessing.
- The question bank classifies every question by provenance (`PYQ`/`OFFICIAL`/
  `LICENSED`/`PYQ_VARIANT`/`AI_GENERATED`/`WEB_DERIVED_ORIGINAL`/`WEB_SOURCED`/
  `USER_CREATED`) and runs dedup + a quality gate before anything enters the pool.

## Project structure

```
scripts/db.mjs            embedded-Postgres lifecycle
prisma/schema.prisma      full data model (hierarchy + blueprint + tracking + bank)
prisma/seed-data/         syllabus, questions, study notes, blueprint seed
prisma/seed.ts            idempotent seeding
src/lib/                  scoring, analytics, streak, auth, practice, study, validation,
                         mastery, progress, tracking, study-visit, pyq,
                         dedup, question-quality, question-source, question-stats,
                         question-bank, generation
src/app/api/              auth, practice, pyq, questions (+report/review), preparation,
                         study/visit REST endpoints
src/app/                  pages (home, practice, analytics, study, pyq, preparation, questions)
src/components/           NavBar, ThemeScript, PracticeRunner, forms, status, dashboards
```

## Roadmap (future phases)

1. **Foundation** (done) — auth, syllabus, question bank, MCQ practice, scoring.
2. **Analytics & Mistake Book** (done) — per-topic breakdown, error-type tagging,
   spaced review of missed questions.
3. **Study** (done) — concise concept notes, mnemonics, comparison tables and
   one-page summaries per topic, driven by weak-topic analytics.
4. **PYQ bank** (done) — verified previous-year questions with provenance + verification;
   infrastructure + workflow complete, content added only from authentic paper copies.
5. **Preparation & tracking** (done) — data-driven exam blueprint, subject/topic/
   concept performance, mastery & completion states, strengths/weaknesses, revision
   queue, daily plan, syllabus coverage, alignment score, "My Target Exam" profile.
6. **Mock system** — sectional/topic/full mocks driven by the blueprint, mock history
   and mock-vs-practice comparison (foundation models already support mock sessions).
7. **Adaptive engine** — concept-level question selection from the large bank
   (verified PYQs + variants + originals by mastery/difficulty/exposure/relevance).
8. **Motivation** — goals, streaks, achievements, daily targets.
9. **Reports & export** — weekly/monthly aggregates, CSV/JSON export.
