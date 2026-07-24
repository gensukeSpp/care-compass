Implementation Plan: Multi-Channel Note Integration (Phase 3)

  Objective
  Establish a reliable way to import daily observations into Care Compass for personal Google
  account users. Since the Google Keep API is restricted to Workspace, we will pivot to a
  "Multi-Channel" approach: Google Tasks API for automated sync and PWA Web Share Target for manual
  "Push" from Keep.

  Key Components & Changes

  1. Backend (Cloudflare Worker) Enhancements
   - OAuth Scope Update: Update src/workers/auth.ts to include
     https://www.googleapis.com/auth/tasks.readonly.
   - Tasks Proxy Endpoint (/api/tasks/sync):
       - Authenticate using session JWT.
       - Refresh Google Access Token via refresh_token stored in Cookie.
       - Fetch tasks from https://tasks.googleapis.com/tasks/v1/lists/@default/tasks.
       - Return a cleaned list of tasks (title, notes, updated timestamp) formatted for the Pending
         Box.

  2. Frontend Service & State Management
   - New Service (src/services/tasksSyncService.ts): Handles communication with the Worker's Tasks
     API endpoint.
   - Store Update (src/store/useStore.ts): 
       - Add syncTasks action to fetch and prepend new tasks to pendingNotes.
       - Implement deduplication based on googleTaskId to prevent importing the same task twice.

  3. PWA Web Share Target (The "Keep Bridge")
   - Goal: Enable users to "Share" a note from the Google Keep mobile app directly to Care Compass.
   - Manifest: Update public/manifest.json to register as a share_target (handling GET or POST
     requests).
   - App Logic: Add a handler in src/App.tsx (or a custom hook) to intercept incoming shared
     text/title and immediately add it to the Pending Box.

  4. UI/UX Refinement
   - PendingDrawer Component:
       - Replace/Update the "Sync" button to "Sync from Google Tasks".
       - Add a "Smart Paste" listener to the Pending Box area.
       - Display a brief "How to Sync" tooltip explaining the use of Google Tasks or the "Share"
         menu from Keep.

  ---