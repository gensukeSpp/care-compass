# Architecture Snapshot: 2026-07-24

## Purpose
Addressing UI/UX issues reported in Issue #76 regarding merge cancellation behavior and tablet layout responsiveness.

## Overview
Improved Drag and Drop reliability by suppressing modal triggers during cancelled merge actions and enhanced responsive layout by dynamically adjusting board margins when the pending box drawer is open.

## Key Changes
- **Merge Cancellation Logic:** 
    - Added `isCancelled` state in `useDragOnBoard` to track merge cancellation.
    - Updated `StickyNote` to check `isCancelled` before triggering `selectNote` (modal open), preventing誤動作.
- **Responsive Layout:**
    - Added `isPendingBoxOpen` to Zustand store (`useStore`).
    - Updated `PendingDrawer` to sync drawer state with `isPendingBoxOpen`.
    - Updated `BoardContent` to apply `mr-[320px]` (margin) dynamically to the board container when the drawer is open, ensuring the board resizes rather than being overlaid.

## Changed Files
- `src/components/board/BoardContent.tsx`
- `src/components/pending/PendingDrawer.tsx`
- `src/components/sticky-note/StickyNote.tsx`
- `src/hooks/useDragOnBoard.ts`
- `src/store/useStore.ts`
