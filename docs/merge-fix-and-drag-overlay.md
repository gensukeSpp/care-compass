# Plan: Merge Logic Fix, Smooth Dragging, and Drag Visual Feedback

This plan addresses Issue #7 and improves the drag-and-drop experience.

## Objective
1.  **Fix Merge Logic:** Change the merge target from "whatever is dropped on" (which was reported as failing/targeting notes[0]) to "existing note of the same category in the target quadrant".
2.  **Improve Drag Smoothness:** Use `DragOverlay` and proper state management to ensure smooth dragging across containers.
3.  **Visual Feedback:** Show the note being dragged on the cursor using `DragOverlay`.
## Proposed Changes

### 1. Store & Types
-   **`src/store/useStore.ts`**:
    -   Ensure `mergeNotes` is category-agnostic (it already is, but we will call it selectively).

### 2. New Component: `StickyNoteView`
-   **`src/components/sticky-note/StickyNoteView.tsx`**:
    -   Create a pure presentational component that takes `title`, `category`, and optional `isDragging` or `isOverlay`.
    -   Move the color mapping and base styles here.

### 3. Component Updates
-   **`src/components/sticky-note/StickyNote.tsx`**:
    -   Use `StickyNoteView`.
    -   Return a simplified div with `ref`, `style`, `listeners`, and `attributes`.
    -   Apply `opacity-0` (or similar) when `isDragging` is true to hide the original while the overlay is shown.
-   **`src/components/pending/PendingNoteItem.tsx`**:
    -   Update to hide when `isDragging` is true.
    -   Use `StickyNoteView` or a consistent style.

### 4. Custom Hook: `useDragOnBoard.ts`
-   **`src/hooks/useDragOnBoard.ts`**:
    -   Refactor `handleDragEnd` to:
        1.  Determine final drop position and target quadrant.
        2.  Find an existing note in that quadrant with the **same category** as the dragged note.
        3.  If a same-category note exists, **always merge** into it (fulfilling "同カテゴリーを対象にしてください").
        4.  If no same-category note exists, place/move the note at the drop position.
    -   Add `handleDragStart` to track the active ID for `DragOverlay`.

### 5. Main App: `src/App.tsx`
-   **`src/App.tsx`**:
    -   Import `DragOverlay`.
    -   Manage `activeId` state.
    -   Pass `handleDragStart` and `handleDragEnd` to `DndContext`.
    -   Implement `DragOverlay` to render the appropriate note preview based on `activeId`.

## Detailed Merge Logic in `handleDragEnd`
```typescript
const activeNote = findNoteById(active.id);
const dropPosition = calculateDropPosition(active);
const targetQuadrant = getQuadrantFromPosition(dropPosition.x, dropPosition.y);

const targetNote = notes.find(n => 
  n.id !== active.id && 
  n.status === targetQuadrant && 
  n.category === activeNote.category
);

if (targetNote) {
  mergeNotes(active.id, targetNote.id);
} else {
  // move/add logic
}
```

1.  **Dragging Smoothness:** Verify that dragging a note (from board or pending box) is smooth and follows the cursor without lag or jumping.
2.  **Visual Feedback:** Verify that a preview of the note is visible attached to the cursor during drag.
3.  **Same-Category Merge:**
    -   Drag a pending "food" note onto a quadrant containing another "food" note. Verify they merge.
    -   Drag a pending "food" note onto a quadrant containing only a "health" note. Verify they do NOT merge (a new note is created).
4.  **Board Note Merge:**
    -   Drag a "food" note from "can" to "risk" which already has a "food" note. Verify they merge.
5.  **No Merge:**
    -   Drag a note to an empty area or a quadrant without a same-category note. Verify it is placed correctly.
