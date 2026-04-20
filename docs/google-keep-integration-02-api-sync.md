Implementation Plan: Google Keep API Sync Integration

  Objective
  Sync notes from Google Keep into the "Pending Box" of Care Compass to facilitate easy
  organization of daily observations into the 4-quadrant board.

  Key Files & Context
   - src/workers/auth.ts: Add Keep API proxy and token refresh logic.
   - src/services/keepSyncService.ts (New): Frontend service to call the sync API.
   - src/store/useStore.ts: Update to handle notes fetched from Keep.
   - src/components/pending/PendingDrawer.tsx: Add a "Sync Google Keep" button.

  Implementation Steps

  Step 1: Backend (Cloudflare Worker) Enhancements
   1. Fix OAuth Scope:
       - Uncomment the Keep readonly scope in src/workers/auth.ts.
       - Note: User must ensure this scope is enabled in Google Cloud Console.
   2. Add Token Refresh Logic:
       - Create a helper to exchange a refresh_token (from Cookie) for a new access_token.
   3. Implement Keep API Proxy Endpoint (/api/keep/sync):
       - Verify session JWT.
       - Retrieve refresh_token from Cookie.
  Step 2: Frontend Service & State Management
   1. Create keepSyncService.ts:
       - Implement a function to fetch notes from the Worker endpoint.
   2. Update useStore.ts:
       - Add an action syncKeepNotes that calls the service and prepends new notes to the
         pendingNotes array, avoiding duplicates based on Keep's Note ID.

  Step 3: UI Integration
   1. Update PendingDrawer.tsx:
       - Add a "Sync" button with a loading state (Lucide RefreshCw icon).
       - Display a success/error message (e.g., "Not available for personal Gmail accounts" if it
         fails due to scope).

  Verification & Testing
   - OAuth Flow: Verify that the consent screen now asks for Keep access.
   - Sync Logic: Confirm that notes from Keep appear in the Pending Box.
   - Error Handling: Ensure the app doesn't crash if the user's account doesn't have Keep API
     access.

  ---