# Phase 3: Quadrant Customization - Dynamic Display

## Objective
Replace all hardcoded quadrant labels in the UI with dynamic values from the currently selected profile.

## Key Files & Context
- `src/components/board/BoardBackground.tsx`: Background labels.
- `src/components/common/AddNoteForm.tsx`: Quadrant selection dropdown.
- `src/components/note-modal/NoteModalFooter.tsx`: "Add to Board" buttons.
- `src/store/useAuthStore.ts`: To get current profile labels.

## Implementation Steps

### 1. Create a Helper Hook or Utility
Consider a hook like `useQuadrantLabels` that returns the labels for the current profile, fallback to defaults if not set.

### 2. Update `BoardBackground.tsx`
Fetch current profile labels from `useAuthStore` and render them in the 2x2 grid.

### 3. Update `AddNoteForm.tsx`
Update the `<select>` options for quadrant choice to use dynamic labels.

### 4. Update `NoteModalFooter.tsx`
Update the text on the "Add to Board" buttons for pending notes to use dynamic labels.

### 5. (Optional) Board Settings UI
Add a way for owners to update labels after creation using the `update_profile_labels` RPC.

## Verification & Testing
- Switch between boards with different quadrant names and verify the UI updates correctly.
- Verify that the "Pending" status label remains consistent and is not affected by quadrant customization.
