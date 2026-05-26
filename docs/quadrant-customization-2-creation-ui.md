# Phase 2: Quadrant Customization - Creation UI

## Objective
Implement the UI in the "Create New Board" modal to allow users to specify custom quadrant names in a 2x2 grid layout.

## Key Files & Context
- `src/components/common/CreateProfileModal.tsx`: The modal UI.
- `src/store/useAuthStore.ts`: Action to pass labels to the DB.

## Implementation Steps

### 1. Modal UI Update (`CreateProfileModal.tsx`)
Add a 2x2 grid of text boxes for quadrant labels.

- Layout:
  - Top-Left: "できる" (can_label)
  - Top-Right: "できない" (cannot_label)
  - Bottom-Left: "危険を伴う" (risk_label)
  - Bottom-Right: "頼みたい" (request_label)
- Use state to manage these 4 labels, defaulting to the standard names.

### 2. Store Action Update (`useAuthStore.ts`)
Update `createProfile` to accept the 4 label strings and pass them to the `create_profile_with_owner` RPC.

```typescript
// useAuthStore.ts
createProfile: async (name, labels?: { can: string; cannot: string; risk: string; request: string }) => {
  // ...
  const { data: profile, error } = await supabase.rpc('create_profile_with_owner', { 
    p_name: name,
    p_can_label: labels?.can || 'できる',
    p_cannot_label: labels?.cannot || 'できない',
    p_risk_label: labels?.risk || '危険を伴う',
    p_request_label: labels?.request || '頼みたい'
  });
  // ...
}
```

## Verification & Testing
- Open the dashboard and click "New Board".
- Enter custom names and verify they are saved in the database after creation.
- Check that omitting names uses the default values.
