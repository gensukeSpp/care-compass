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
- [x] **Dynamic Status & History:** Update note status on D&D and log persistent changes to `note_history`.

### Phase 2: Enhanced UI & Interactive Features
- [ ] **Visual Feedback:** Implement "Hover/Tap Preview" for note contents before opening the modal.
- [x] **Pending Box Drawer:** Implementation of a sliding drawer for notes (ready for Keep/MD integration).
- [x] **Markdown File Import:** Basic support for dropping `.md` files to create board notes (via `useDropMdFile`).
- [x] **Merge Pending Note with Existing Board Note (Issue #7):** Implement logic to append content when a pending note is dropped on an existing board note.
- [x] **Pending Box Improvements (Issue #12):** Prepend new notes to Pending Box and support direct addition from form.
- [ ] **Rich Editor:** Integrate `react-simplemde-editor` for better Markdown editing experience.
- [x] **Category Polish:** Ensure icons (🏠, 🍱, 💪, 💊, 🧑‍🤝‍🧑) are consistently used in StickyNotes and Modal.

### Phase 3: Advanced Features & Integration
- [x] **Markdown Batch Import (1):** Structural split by headers & Multi-file drop support.
- [ ] **Markdown Batch Import (2):** Keyword-based automatic classification (Category/Status).
- [ ] **Markdown Batch Import (3):** AI-enhanced context analysis & summarization.
- [x] **Google Tasks to Pending Box (Issue #29):** Support for selecting task lists and tasks to import into Pending Box.
- [x] **Family Invitation (Issue #59):** Implemented invitation via link and QR code, including `InviteModal` and `JoinPage`.
- [x] **Supabase Auth Migration:** Transitioned from custom Worker auth to official Supabase Auth SDK (Google OAuth). Fixed UUID type mismatches and enabled proper RLS using `auth.uid()`.
- [x] **Owner Registration during Board Creation (Issue #31):** Successfully implemented `profiles` and `board_members` registration when creating a new board.
- [ ] **Dashboard & Board Selection (Issue #36):** Implement a dedicated landing page to list accessible boards, allow switching, and trigger new board creation.
- [ ] **PWA Support:** Add manifest and service worker for mobile home screen installation.
- [ ] **Google Keep Integration (API Sync):** API sync to fetch notes into Pending Box (Workspace accounts only).
- [ ] **Variable Quadrant Boundaries:** Allow dragging the quadrant axes to resize areas.
- [x] **Full Data Sync (Issue #56, #57):** All notes and change history are now fully synchronized with Supabase DB.
- [x] **Quadrant Customization - Foundation (Issue #63):** Added custom label columns to `profiles` and updated RPCs.
- [x] **Quadrant Customization - Creation UI (Issue #64):** Implemented 2x2 grid for label customization in `CreateProfileModal`.
- [ ] **Quadrant Customization - Dynamic Display (Issue #65):** Reflect custom labels in board grid and forms.
- [ ] **Board Settings UI (Issue #66):** Allow owners to update labels and profile names after creation.

## 5. Directory Structure
```
src/
├── assets/             # Images, Icons, Global CSS
├── components/         # UI Components
│   ├── auth/           # Login/Logout Buttons
│   ├── common/         # Buttons, Forms, Modals (CreateProfileModal)
│   ├── board/          # Board, Grid, Quadrants
│   ├── sticky-note/    # Sticky Note item
│   ├── note-modal/     # Detail View, Editor, History, MD Renderer
│   └── pending/        # Pending Box Drawer, Import items, TasksModal
├── hooks/              # D&D Logic, File Import, Resize handling
├── lib/                # External Lib Configs (supabase.ts)
├── pages/              # AuthCallback, DashboardPage
├── services/           # External Sync (Tasks, AI Services)
├── store/              # Zustand Store (State Management, Auth Store)
├── types/              # TypeScript Definitions
├── utils/              # Coordinate Calc, API Helpers, MD Splitting
├── workers/            # Cloudflare Workers (Auth API proxy)
├── App.tsx             # Main Layout & Routing
└── main.tsx            # Entry point
```

## 6. Development Commands
- `bun run dev`: Start dev server
- `bun run build`: Build for production
- `bun run lint`: Linting
- `bun run test`: Run tests
