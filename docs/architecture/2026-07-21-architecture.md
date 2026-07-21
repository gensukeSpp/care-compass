# Architecture Snapshot: 2026-07-21

## Purpose
Implementing percentage-based coordinate system and improving the Drag and Drop (DnD) system logic to enhance responsiveness and user experience on Care Compass boards.

## Overview
Replaced pixel-based positioning with a percentage-based system for sticky notes, introduced atomic merge logic based on node contact during drag, and improved responsive UI for tablet devices.

## Key Changes
- **Percentage-based Coordinates:** Refactored `positionUtils.ts` and updated `Note` type to ensure absolute positioning is calculated based on relative percentages for board responsiveness.
- **Improved DnD Workflow:** 
    - Moved merge logic from post-drop to active drag contact (`isOver`).
    - Added `activeCategory` state to the Zustand store to allow conditional visual feedback (only highlight same-category notes when dragging).
- **Responsive UI:** 
    - Updated `StickyNoteView` to reduce height by ~66% (to 1/3) on tablet screens (`max-md`) while maintaining width, and hid category labels for a cleaner compact view.
- **Visual Feedback:** 
    - Standardized note rendering via `StickyNoteView` for both board notes and pending items.
    - Enhanced `DragOverlay` usage for smooth interaction.

## Changed Files
- `src/components/pending/PendingNoteItem.tsx`
- `src/components/sticky-note/StickyNote.tsx`
- `src/components/sticky-note/StickyNoteView.tsx`
- `src/hooks/useDragOnBoard.ts`
- `src/store/initialData.ts`
- `src/store/useStore.test.ts`
- `src/store/useStore.ts`
- `src/types/index.ts`
- `src/utils/positionUtils.ts`
