# Task 02: Merge & Drag Logic Refactoring

## Objective
Implement DnD workflow and automatic merge logic.

## Tasks
- [ ] Implement `findMergeTarget` in `src/hooks/useDragOnBoard.ts` to identify candidates for merging within the same quadrant and category.
- [ ] Refactor `handleDragEnd` in `src/hooks/useDragOnBoard.ts`:
    - Calculate drop position percentage.
    - Execute merge logic if `findMergeTarget` matches.
    - Otherwise, update position/status in `src/store/useStore.ts` using percentage coordinates.
- [ ] Enhance `src/store/useStore.ts` to manage merge operations atomically.
