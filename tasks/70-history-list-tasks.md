# Tasks for Issue #70 — History List Page

Branch: feature/history-list/70

- [ ] 1. Create SQL RPC function for fetching history
  - File: supabase/rpc_functions.sql
  - Name: `get_all_history(p_profile_id uuid)`
  - Logic: Join `note_history` and `sticky_notes`, order by `created_at DESC`

- [ ] 2. Create History Page skeleton
  - File: src/pages/HistoryPage.tsx
  - Logic: Fetch data using RPC, manage `viewMode` state (timeline | note)

- [ ] 3. Implement Timeline View
  - File: src/components/history/HistoryTimelineView.tsx
  - UI: Table or List showing Time, Title, From->To, Truncated Detail

- [ ] 4. Implement Note Grouped View
  - File: src/components/history/HistoryNoteView.tsx
  - UI: Grouped by note title, showing list of changes per note

- [ ] 5. Header Navigation
  - File: src/components/layout/HeaderMenu.tsx (or similar)
  - Logic: Add link to `/history`

- [ ] 6. Testing
  - Verify chronological order
  - Verify view switching
  - Verify data loading and display

Notes:
- Use Japanese locale for date formatting (YYYY/MM/DD HH:mm).
- Truncate note detail previews.
- Ensure efficient data loading.
