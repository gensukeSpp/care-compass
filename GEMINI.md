# Care Compass (ケア・コンパス) - Project Bible Alignment

This project follows the design and principles outlined in `設計書.md`. Any development should prioritize the concepts and architecture defined there.

## 1. Project Concept
**Care Compass** is a 4-quadrant action board designed to visualize the independence and safety of elderly individuals, optimizing family support.

### The Four Quadrants
- **Can (できる):** Maintains self-confidence.
- **Cannot (できない):** Requires intervention/service.
- **Risk (危険を伴う):** Requires monitoring or environmental improvement.
- **Request (頼みたい):** Reflects the person's own will/requests.

## 2. Technical Stack
- **Frontend:** React 19 (TypeScript) + Vite
- **Styling:** Tailwind CSS 4 (Mobile-friendly design)
- **State Management:** Zustand (with Persistence)
- **Drag & Drop:** `dnd-kit` (Using absolute coordinates or percentages)
- **Content:** `react-markdown` for note details
- **Icons:** `Lucide React`
- **Testing:** Vitest

## 3. Core Architecture Mandates (from 設計書.md)
- **Data Schema:** Each note MUST have: `id`, `title`, `content` (MD), `category`, `status` (quadrant), `position` (x, y), `author`, `updatedAt`.
- **Abstraction:** Separate the board framework from the sticky notes to allow for future quadrant changes (e.g., Urgency vs. Importance).
- **Coordinate System:** Coordinate calculation should ideally be independent or percentage-based to support variable boundary lines.
- **Storage:** Initial implementation uses `LocalStorage` via Zustand `persist`.

## 4. Current Implementation Status & Todo List

### Phase 1: Core Foundation (MVP Refinement)
- [x] Basic 4-quadrant UI layout.
- [x] Sticky note rendering with color coding.
- [x] Basic Drag & Drop (dnd-kit).
- [x] **Refactor Data Types:** Align `StickyNote` type with `設計書.md` (Add `status`, unify `Note` types).
- [x] **Coordinate Normalization:** Implement percentage-based positioning for responsiveness.
- [x] **Note Modal:** Full Markdown rendering and basic edit functionality.
- [x] **Category Mapping:** Ensure icons and colors match the 5 categories in `設計書.md`.
- [x] **Dynamic Status & History:** Update note status on D&D and log changes, viewable in the modal.

### Phase 2: Enhanced UI & Features
- [ ] **Google Keep Drawer:** Implementation of a "Pending Box" drawer for notes from Google Keep/Markdown paste.
- [ ] **Markdown Batch Import:** Tool to convert care manager reports (Markdown) into individual sticky notes.
- [ ] **Dashboard:** Subject selection screen (e.g., Father, Mother).

### Phase 3: Advanced Features
- [ ] Variable Quadrant Boundaries.
- [ ] Multi-device optimization (Tailwind fine-tuning).
- [ ] Potential Backend Integration (Supabase) for family sharing.

## 5. Directory Structure
```
src/
├── assets/             # Images, Icons, Global CSS
├── components/         # UI Components
│   ├── common/         # Buttons, Forms, Modals
│   ├── board/          # Board, Grid, Quadrants
│   └── sticky-note/    # Note, Detail View, MD Renderer
├── hooks/              # D&D Logic, LocalStorage
├── lib/                # External Lib Configs
├── services/           # Google Keep API, External Sync
├── store/              # Zustand Store
├── types/              # TypeScript Definitions
├── utils/              # Coordinate Calc, Date Formatting
├── App.tsx             # Layout
└── main.tsx            # Entry
```

## 6. Development Commands
- `bun run dev`: Start dev server
- `bun run build`: Build for production
- `bun run lint`: Linting
- `bun run test`: Run tests
