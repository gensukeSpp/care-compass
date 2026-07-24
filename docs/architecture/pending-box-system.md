# Pending Box System Architecture

## Overview

The **Pending Box** is a drawer-based UI component that serves as a staging area for sticky notes before they are placed on the board. It supports multiple input sources: manual form submission, Markdown file drops, Google Keep integration, and Google Tasks imports. Notes in the Pending Box can be dragged onto the board or merged with existing notes.

---

## Key Features

### 1. **Multiple Input Sources**
- **AddNoteForm**: Users can create notes via a form and select "保留" (Pending) as the status
- **Markdown Drop**: `.md` files dropped on the Pending Drawer are parsed and imported as pending notes
- **Paste Functionality**: Text pasted directly into the drawer is converted into pending notes
- **Google Tasks**: Tasks from Google Tasks can be imported into the Pending Box (requires auth flow)

### 2. **Latest-First Display Order**
- New pending notes are prepended to the list (newest at the top)
- Implemented via `unshift()` instead of `push()` in store actions
- Provides intuitive UX: users see the most recently added items first

### 3. **Drag-and-Drop Integration**
- Pending notes are fully draggable via `dnd-kit`
- Can be placed on the board by:
  - Dragging to a specific position (moves note to board with status updated)
  - Merging with an existing board note (appends content if same category)

### 4. **Persistent Drawer UI**
- Right-side drawer that slides in/out with smooth transitions
- Always accessible via a blue handle button
- Supports drag-over interactions for file import
- Shows count and status of pending notes

---

## Component Structure

### **PendingDrawer.tsx**
Main container component that manages the drawer UI, handles file drops and paste events.

**Responsibilities:**
- Render the sliding drawer interface
- Handle drag-over and drop events for file imports
- Manage drawer open/close state
- Display pending notes list
- Launch TasksModal for Google Tasks import

**Key Methods:**
- `handlePaste()`: Converts pasted text into a pending note with `addPendingNote()`
- `handleDrop()`: Delegates to `useFileImport()` hook for Markdown parsing

**Data Flow:**
```
PendingDrawer
├── Reads: pendingNotes, selectNote (from useStore)
├── Invokes: handleDrop (from useFileImport), TasksModal (for Google Tasks)
└── Renders: PendingNoteItem[] for each pending note
```

---

### **PendingNoteItem.tsx**
Individual pending note component with drag capability.

**Responsibilities:**
- Render a single pending note as a draggable sticky note preview
- Show note title and category icon
- Provide click handler to open note detail modal

**Key Features:**
- Uses `useDraggable()` from `dnd-kit` with data type `'pending-note'`
- Passes note object in drag data for merge/board placement logic
- Shows opacity change during drag (`isDragging ? 'opacity-0' : ''`)

---

## Store Integration (useStore.ts)

### **State Properties**
```typescript
pendingNotes: Note[];  // Array of pending notes
```

### **Actions**

#### **`addPendingNote(title, content, category)`**
Adds a single note to the Pending Box.
- Calls `addNote(..., 'pending')` internally
- Note is **prepended** to `pendingNotes` array (line 187):
  ```typescript
  set(state => ({ pendingNotes: [newNote, ...state.pendingNotes] }));
  ```
- Status automatically set to `'pending'`

#### **`addPendingNotes(newNotes[])`**
Batch import for multiple notes (MD files, Google Tasks).
- **Prepends** all new notes to the front of `pendingNotes` (line 202):
  ```typescript
  pendingNotes: [...(data as Note[]), ...state.pendingNotes]
  ```
- Supports optional `googleTaskId` for Google Tasks tracking

#### **`moveToPending(id)`**
Moves a note from the board to the Pending Box.
- Updates note status to `'pending'`
- **Prepends** the note to `pendingNotes` (line 254):
  ```typescript
  pendingNotes: [updatedNote, ...pendingNotes.filter(n => n.id !== id)]
  ```
- Removes from board notes

#### **`moveToBoard(id, x, y)`**
Moves a note from Pending Box to the board.
- Calculates quadrant based on drop position (x, y)
- Updates note status to the target quadrant ('can', 'cannot', 'risk', 'request')
- **Removes** from `pendingNotes` and adds to `notes` array
- Logs history entry for the status change

#### **`mergeNotes(sourceId, targetId)`**
Merges a pending note (or board note) with an existing board note.
- **Source**: Can be from pending or board (`pendingNotes.find()` or `notes.find()`)
- **Target**: Must be a board note
- **Merge Logic**: Appends source content to target with timestamp attribution
- **Removes** source from `pendingNotes` (or `notes`)
- **Updates** target with merged content and history

---

## Data Flow Diagram

```
Input Sources
    ↓
┌─────────────────┐
│ AddNoteForm     │ → addPendingNote() → [NEW, ...pendingNotes]
│ MD File Drop    │ → addPendingNotes() → [NEW[], ...pendingNotes]
│ Paste Text      │ → addPendingNote() → [NEW, ...pendingNotes]
│ Google Tasks    │ → addPendingNotes() → [NEW[], ...pendingNotes]
└─────────────────┘
    ↓
┌──────────────────────┐
│  Pending Box Store   │
│  pendingNotes: Note[]│
└──────────────────────┘
    ↓ (Drag & Drop via dnd-kit)
    ├─→ moveToBoard(id, x, y)  →  Board (status = quadrant)
    └─→ mergeNotes(sourceId, targetId)  →  Append to existing note
```

---

## Display Order Behavior

### **Latest-First (Newest at Top)**

All pending note additions follow this pattern:
1. **Form Submission**: New note prepended
2. **Markdown Import**: All imported notes prepended as a batch
3. **Board → Pending**: Note moved to Pending prepended
4. **Paste**: New note prepended

**Implementation:**
```typescript
// All use unshift() pattern (prepend)
pendingNotes: [newNote, ...state.pendingNotes]  // Single
pendingNotes: [...newNotes, ...state.pendingNotes]  // Batch
```

**Rationale:**
- Users see recently added items immediately without scrolling
- Natural for incremental imports (each batch appears at top)
- Maintains task management UX (newest items prioritized)

---

## Integration with Drag-and-Drop

### **Drag Start**
- `PendingNoteItem` is draggable with data type `'pending-note'`
- Drag data includes full note object

### **Drag End (Board placement)**
1. **Position Calculation**: Drop coordinates converted to percentages
2. **Quadrant Detection**: `getQuadrantFromPosition()` determines target quadrant
3. **Merge Check**: `findMergeTarget()` checks if target quadrant has note with same category
4. **Action**:
   - **If merge**: `mergeNotes()` appends content and removes pending note
   - **If no merge**: `moveToBoard()` updates position, status, and removes from pending

### **Drag End (Pending Box drop)**
- If dropped back on Pending Drawer, note remains in `pendingNotes`
- No action taken

---

## Integration with External Services

### **Google Tasks Import**
- `TasksModal` component in Pending Drawer
- Allows users to select task lists and individual tasks
- `addPendingNotes()` invoked with task data
- Tasks stored with `googleTaskId` for deduplication

### **Google Keep Integration** (Planned)
- API sync to fetch notes from Google Keep
- Direct `addPendingNotes()` call with Keep note data
- Notes marked with `google_keep_id` to prevent duplicate imports

### **Markdown File Drop**
- `useDropMdFile()` hook parses `.md` files
- Structural split by headers (see `markdown-batch-import-1_structural-split.md`)
- Batch import via `addPendingNotes()`
- Multiple files supported (appended batch by batch)

---

## Note Schema in Pending Box

Each pending note adheres to the full `Note` type:

```typescript
{
  id: string;                    // UUID
  title: string;                 // Max 50 chars typically
  content: string;               // Markdown content
  category: Category;            // 'house' | 'food' | 'exercise' | 'health' | 'social'
  status: 'pending';             // Always 'pending' while in Pending Box
  x: number;                     // Position (0-100%, default 0)
  y: number;                     // Position (0-100%, default 0)
  profile_id: string;            // Associated profile/board
  author_id: string;             // User who created the note
  updatedAt: string;             // ISO timestamp
  history: History[];            // Change log (populated on detail view)
  google_task_id?: string;       // Optional Google Tasks reference
  google_keep_id?: string;       // Optional Google Keep reference (planned)
}
```

---

## UI States & Interactions

### **Drawer States**
- **Closed**: Only blue handle visible on right edge (40px width)
- **Open**: Full drawer shown (320px width) with handle on left side of drawer
- **Drag Over**: Visual feedback for file drop area

### **Pending Note Item States**
- **Default**: Gray background with category icon, title visible
- **Hover**: Slightly elevated shadow, cursor changes to grab
- **Dragging**: Opacity set to 0 (hidden, preview shown via DragOverlay)
- **Click**: Opens note detail modal via `selectNote()` and modal display logic

### **Empty State**
- Shows placeholder text: "保留中の付箋はありません"
- Suggests usage: "Google KeepやMarkdownから追加したメモがここに表示されます"

---

## Performance Considerations

### **List Rendering**
- Uses `.map()` for pending notes (O(n) with React keys)
- Virtual scrolling not currently implemented (suitable for < 100 notes)
- Consider virtualization if pending list grows large

### **Drag Performance**
- Drag overlay managed by `App.tsx` DnD context
- Smooth 60fps drag via `dnd-kit` native handling
- Merge check is O(n) quadrant search; acceptable for typical board size

### **Storage**
- Pending notes persisted to Supabase via `addNote()` with status='pending'
- LocalStorage fallback via Zustand persist middleware (development only)
- No in-memory limit on pending notes; database constraints apply

---

## Future Enhancements

1. **Pending Box Filtering**: Filter by category, date, or source (MD vs. Keep vs. Tasks)
2. **Bulk Actions**: Select multiple pending notes for batch board placement
3. **Rich Editor**: Replace plain text with Markdown editor in Pending Drawer
4. **Preview on Hover**: Show note content before opening modal
5. **Auto-Classification**: AI-powered category and quadrant suggestions
6. **Keyboard Shortcuts**: Quick actions (e.g., Enter to move first to board, Escape to close drawer)

---

## Related Files

| File | Purpose |
| :--- | :--- |
| `src/components/pending/PendingDrawer.tsx` | Main drawer UI and input handling |
| `src/components/pending/PendingNoteItem.tsx` | Individual note component with drag |
| `src/components/pending/TasksModal.tsx` | Google Tasks import modal |
| `src/store/useStore.ts` | Store actions for pending note management |
| `src/hooks/useDropMdFile.ts` | Markdown file drop handler |
| `src/hooks/useDragOnBoard.ts` | Board D&D logic including pending merge |
| `src/services/tasksSyncService.ts` | Google Tasks API integration |
| `docs/markdown-batch-import-1_structural-split.md` | Markdown parsing strategy |

---

## Summary

The Pending Box is a flexible staging system that:
- **Accepts notes** from multiple sources (form, files, tasks, clipboard)
- **Displays newest first** for intuitive task management
- **Supports drag-to-board** with automatic quadrant detection and merging
- **Integrates seamlessly** with the board's D&D system and store
- **Persists to database** for reliable data handling
- **Enables future extensions** for advanced import workflows (AI classification, bulk actions, etc.)
