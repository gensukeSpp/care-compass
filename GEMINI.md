# Care Compass (ケア・コンパス) - Project Bible Alignment

This project follows the design and principles outlined in `設計書.md`. Any development should prioritize the concepts and architecture defined there.

## 1. Project Concept
**Care Compass** is a 4-quadrant action board designed to visualize the independence and safety of elderly individuals, optimizing family support. It aims to clarify the "appropriate distance" by identifying what the person "can do" vs "is risky," resolving discrepancies in family support.

### The Four Quadrants
- **Can (できる):** Maintains self-confidence and independence.
- **Cannot (できない):** Requires intervention, services, or family support.
- **Risk (危険を伴う):** Requires monitoring, environmental improvement, or preventive measures.
- **Request (頼みたい):** Reflects the person's own will and specific requests.

## 2. Technical Stack
- **Frontend:** React 19 (TypeScript) + Vite
- **Styling:** Tailwind CSS 4 (Mobile-friendly, PWA-ready design)
- **State Management:** Zustand (with Persistence)
- **Drag & Drop:** `dnd-kit` (Using percentage-based coordinates)
- **Content:** `react-markdown` (Rendering) + `react-simplemde-editor` (Planned for editing)
- **Icons:** `Lucide React`
- **Testing:** Vitest

## 3. Core Architecture Mandates (from 設計書.md)
- **Data Schema:** Each note MUST have: `id`, `title`, `content` (MD), `category`, `status` (quadrant), `position` (x, y), `author`, `updatedAt`, and `history` (log of changes).
- **Abstraction:** Separate the board framework from the sticky notes to allow for future quadrant changes (e.g., Urgency vs. Importance).
- **Coordinate System:** Coordinate calculation is percentage-based to support responsive layouts and variable boundary lines.
- **Append Logic:** Notes support an "Append Mode" where new comments are timestamped and added to the end of the content.
- **Merge Logic:** Dropping a new note onto an existing one should merge/append the content.

## 4. Current Implementation Status & Todo List

### Phase 1: Core Foundation (MVP Refinement)
- [x] Basic 4-quadrant UI layout.
- [x] Sticky note rendering with color coding (5 categories).
- [x] Basic Drag & Drop (dnd-kit) with percentage normalization.
- [x] **Refactor Data Types:** Align `StickyNote` type with `設計書.md`.
- [x] **Note Modal:** Markdown rendering and basic edit functionality.
- [x] **Dynamic Status & History:** Update note status on D&D and log changes.

### Phase 2: Enhanced UI & Interactive Features
- [ ] **Visual Feedback:** Implement "Hover/Tap Preview" for note contents before opening the modal.
- [x] **Pending Box Drawer:** Implementation of a sliding drawer for notes (ready for Keep/MD integration).
- [x] **Markdown File Import:** Basic support for dropping `.md` files to create board notes (via `useDropMdFile`).
- [ ] **Merge Pending Note with Existing Board Note (Issue #7):** Implement logic to append content when a pending note is dropped on an existing board note.
- [ ] **Rich Editor:** Integrate `react-simplemde-editor` for better Markdown editing experience.
- [ ] **Category Polish:** Ensure icons (🏠, 🍱, 💪, 💊, 🧑‍🤝‍🧑) are consistently used in StickyNotes and Modal.

### Phase 3: Advanced Features & Integration
- [ ] **Markdown Batch Import:** Tool to convert complex reports or multiple files into individual sticky notes in Pending Box.
- [ ] **Google Keep Integration:** Implementation of OAuth 2.0 and API sync to fetch notes into Pending Box.
- [ ] **PWA Support:** Add manifest and service worker for mobile home screen installation.
- [ ] **Dashboard:** Subject selection screen (e.g., Father, Mother).
- [ ] **Variable Quadrant Boundaries:** Allow dragging the quadrant axes to resize areas.
- [ ] **Potential Backend Integration:** Supabase for real-time family sharing and auth.

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
