## Plan: Implement Percentage-Based Positioning for Sticky Notes

TL;DR: Convert sticky note coordinates from pixel-based to percentage-based positioning to enable responsiveness across different screen sizes, following GEMINI.md Phase 1 requirements.

**Steps**
1. Create utility functions in `src/utils/positionUtils.ts` for coordinate conversions (pixel ↔ percentage) and quadrant calculations.
2. Update type definitions in `src/types/index.ts` to clarify position units and add metadata for size calculations.
3. Modify store logic in `src/store/useStore.ts` to handle percentage-based position updates and store container dimensions.
4. Update drag handling in `src/App.tsx` to convert dnd-kit pixel deltas to percentages using container size.
5. Modify `src/components/sticky-note/StickyNote.tsx` to render positions using percentage-to-pixel conversion in styles.
6. Migrate initial data in `src/store/initialData.ts` to percentages based on current viewport size.
7. Add resize handling to recalculate positions on window resize for responsiveness.

**Relevant files**
- `src/utils/positionUtils.ts` — New utility functions for conversions
- `src/types/index.ts` — Update position types
- `src/store/useStore.ts` — Update position management
- `src/App.tsx` — Update drag end handler and add resize listener
- `src/components/sticky-note/StickyNote.tsx` — Update rendering logic
- `src/store/initialData.ts` — Convert pixel values to percentages

**Verification**
1. Test drag and drop on different screen sizes to ensure notes stay proportionally positioned.
2. Verify initial notes load at correct relative positions.
3. Check that notes can move freely across quadrant boundaries.
4. Test window resize: positions should recalculate to maintain relative placement.
5. Run existing tests and add new ones for position conversions.

**Decisions**
- Board size detection: Use `window.innerWidth/Height` for full-screen container.
- Resize handling: Recalculate positions on window resize to maintain responsiveness.
- Quadrant boundaries: Allow free movement across quadrants (no constraints).
- Initial data migration: Calculate percentages based on current viewport size.

**Further Considerations**
1. Consider adding a ResizeObserver for more accurate container size detection if board becomes non-fullscreen in future phases.