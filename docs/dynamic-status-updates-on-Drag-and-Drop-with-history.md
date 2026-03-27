## Plan: Implement Dynamic Status Updates on Drag-and-Drop with History

TL;DR: Add logic to update Note.status based on position after drag, and track status changes in history for future undo/redo.

**Steps**
1. Add history field to Note type in types/index.ts (array of note snapshots for undo/redo)
2. Create getQuadrantIdFromPosition function in positionUtils.ts to determine quadrant from x,y percentages
3. Update useStore.ts to include history state (undo/redo stacks) and actions (pushHistory, undo, redo)
4. Modify handleDragEnd in App.tsx to calculate new status and update note with history recording
5. Add tests for quadrant detection and status updates

**Relevant files**
- `src/types/index.ts` — Add history array to Note interface
- `src/utils/positionUtils.ts` — Add `getQuadrantIdFromPosition(x: number, y: number): QuadrantId`
- `src/store/useStore.ts` — Add history state and mutation actions
- `src/App.tsx` — Update drag end handler to use quadrant detection

**Verification**
1. Drag note to different quadrant, verify status updates in store
2. Check history snapshots are created on status change
3. Test undo/redo restores previous states
4. Run existing tests to ensure no regressions

**Decisions**
- History implemented as undo/redo stacks of full note arrays (simple, effective for small datasets)
- No UI changes yet; history stored for future features
- Quadrant boundaries: x<50/y<50=can, x>=50/y<50=cannot, x<50/y>=50=risk, x>=50/y>=50=request

**Further Considerations**
1. Performance: For large note counts, consider optimizing history storage (e.g., diffs instead of full snapshots)