# Copilot instructions — Care Compass

Purpose: help future Copilot CLI / code-assistant sessions operate effectively in this repo by summarizing build/test commands, architecture, and codebase conventions.

---

## Quick commands
- Dev server: bun run dev  (or npm run dev / yarn dev)
- Build: bun run build  (runs `tsc -b && vite build`)
- Lint: bun run lint  (or npm run lint)
- Preview production build: bun run preview
- Test (runner): bun run test  (Vitest)

Run a single test file or pattern:
- npm/bun: npm run test -- path/to/file.spec.ts
- direct vitest: npx vitest run path/to/file.spec.ts
- run a single test name: npx vitest -t "partial test name"

Note: this repo's package.json scripts are authoritative (see package.json).

---

## High-level architecture (big picture)
- Frontend SPA: React 19 + Vite + TypeScript. Styling with Tailwind CSS 4.
- State: Zustand (with persistence). Store modules live under `src/store/`.
- Drag & Drop: dnd-kit with percentage-normalized coordinates to support responsive board layout.
- Notes: Sticky notes are Markdown-based and rendered with `react-markdown`. Editor planned with `react-simplemde-editor`.
- Persistence: LocalStorage for local persistence; code is structured for future real-time sync (Supabase/Cloud) and Cloudflare Workers (workers/).
- Integrations: Google Keep auth + API plumbing in `src/services/` and docs in `docs/`.
- Build/test tooling: TypeScript (tsc projects), Vite build, Vitest for tests, ESLint for linting.

Key docs: docs/*.md (markdown import, Google Keep integration, percentage-based coordinates, etc.). See `docs/` for feature-specific design notes.

---

## Key repo-specific conventions (read before editing code)
- Sticky note schema (required fields):
  - id (uuid), title, content (Markdown), category (color/tag), status (quadrant id: can/cannot/risk/request), position {x,y} (percentage-based), author, updatedAt, history (change log).
  - This schema is referenced across `src/types/`, `src/store/`, and `src/utils/` coordinate helpers. Keep these fields when altering note shape.

- Coordinates: store positions as percentages relative to board size (not raw px). Coordinate conversion helpers exist in `src/utils/` — use them to normalize/un-normalize coordinates when reading/writing position.

- Drag & Drop behaviors:
  - Dropping between quadrants updates `status` and logs the change into `history`.
  - Dropping a pending/imported note onto an existing board note merges/appends content (Append Mode). The merge should timestamp and attribute appended entries.

- Pending Box / Drawer: there is a pending drawer UI for imported notes and Google Keep sync. New pending notes are prepended to preserve latest-first ordering — follow existing helper in `src/hooks/usePendingBox` or equivalent.

- Markdown batch import behavior: imports split by headers (see `docs/markdown-batch-import-1_structural-split.md`). Keyword-based classification is in docs and should be reused rather than reimplemented ad-hoc.

- Tests: Vitest is used. Unit test utilities and DOM helpers rely on `@testing-library/*` and jsdom. Place tests next to modules under `src/` with `.spec.ts` or `.test.ts`.

- Naming & places:
  - Components: `src/components/<feature>/` (board, sticky-note, pending, note-modal)
  - Hooks: `src/hooks/` (D&D logic, file import, resize handlers)
  - Services: `src/services/` (Keep API, auth, sync)
  - Store: `src/store/` (Zustand stores and persistence code)

- Build step order: `tsc -b` (type-check / project refs) is run before `vite build`. Avoid changing build ordering unless you update tsconfig project references.

---

## Where to look for implementation details
- Design and feature rationale: `設計書.md` (root)
- Scripts & dependencies: `package.json`
- Feature design docs: `docs/*.md` — especially Google Keep integration and markdown import docs.
- Worker code and auth flows: `src/workers/` and `src/services/`.

---

## AI / assistant configs found
- No existing Copilot/Jules/Claude/other assistant rules files detected in repo root. If adding automated assistant rules, place them under `.github/` or root and reference in this file.

---

If updates are made to scripts, architecture, or conventions, update this file so future Copilot sessions use the canonical commands and rules.
