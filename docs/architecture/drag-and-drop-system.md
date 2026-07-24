# Drag and Drop System Architecture

## Overview
The Care Compass Drag and Drop (DnD) system is built upon `dnd-kit`, utilizing a percentage-based coordinate system to ensure a mobile-friendly and responsive board experience.

## Coordinate System (Percentage-based Positioning)
To maintain relative positions of sticky notes regardless of screen size, coordinates are handled as percentages of the container size.
- **Implementation**: Defined in `src/utils/positionUtils.ts`.
- **Calculations**:
    - `pixelsToPercentage(px, containerSize)`: Converts pixel coordinates to percentage during drag.
    - `percentageToPixels(percent, containerSize)`: Converts percentages back to pixels for rendering (absolute positioning).
    - `getQuadrantFromPosition(x, y)`: Determines the target quadrant (can, cannot, risk, request) based on percentage coordinates.

## DnD Workflow
The core DnD logic is managed by `useDragOnBoard.ts`.

1. **Start**: `handleDragStart` tracks the ID (`activeId`) of the note being dragged.
2. **Move**: `dnd-kit` standard behavior is used to show a preview via `DragOverlay`.
3. **End**: `handleDragEnd` is triggered:
    - Calculates the percentage coordinates of the drop position.
    - Executes the merge logic (if applicable).
    - If no merge occurs, updates the note's position/quadrant in the store (or moves from the Pending Box).

## Merge Logic
Intuitively merges notes dropped into the same quadrant that share the same category.
- **Identification**: `findMergeTarget` searches for notes within the target quadrant.
- **Conditions**:
    1. Must not be the note currently being dragged.
    2. Must be in the same target quadrant.
    3. Must have the same category.
- **Execution**: Triggers `mergeNotes` after a `window.confirm` check.

## Component Structure
- `App.tsx`: Provides the DnD context and renders the `DragOverlay`.
- `BoardContent.tsx`: Injects sensors and handlers via the `useBoardDnd` hook.
- `StickyNote.tsx`: Represents an individual draggable note. Uses `StickyNoteView` for styling.
- `StickyNoteView.tsx`: A pure presentational component that adjusts styles based on states (Dragging, Over).
