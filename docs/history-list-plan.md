# Plan: History List Page (Issue #70)

## Objective
Implement a history view page that allows users to see the changes made to sticky notes. The page will have two views: a chronological timeline and a grouped-by-note view.

## Functionality
- **Timeline View**: Lists all history events in reverse chronological order.
  - Fields: Date/Time, Note Title, Old Status, New Status.
  - Limit: Truncate "Detail" text to maintain readability.
- **Note View**: Groups history events by note title.
  - If history exists: List events for each note, ordered by date descending.
  - If no history exists: Show note title and current status.
- **Toggle**: Provide a button to switch between views.
- **Navigation**: Access via the header menu.

## Database (RPC)
- Create `get_all_history(p_profile_id uuid)` to join `note_history` and `sticky_notes` tables.

## Implementation Steps
1. **Database**: Implement `public.get_all_history` RPC.
2. **Frontend Components**:
   - `src/pages/HistoryPage.tsx`
   - `src/components/history/HistoryTimelineView.tsx`
   - `src/components/history/HistoryNoteView.tsx`
3. **Logic**: Implement view mode state management and data grouping in the page component.

## Verification
- Chronological order matches the timestamp in `History` (created_at).
- Switching views works as expected.
- Clicking a note in the history list opens the note modal (if possible).
