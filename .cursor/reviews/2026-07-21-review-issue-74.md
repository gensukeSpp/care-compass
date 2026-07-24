### 📋 Pull Request Summary

- **変更の概要:** Issue #74 に基づき、付箋の座標をパーセンテージベースに整理し、DnD マージ判定を象限ベースの自動検出から `dnd-kit` の接触検知（`over`）ベースへ変更。`activeCategory` による視覚フィードバックとタブレット向け UI 調整も含む。
- **影響範囲:** ボード上の付箋ドラッグ＆ドロップ、マージ動作、付箋表示（`StickyNoteView`）、履歴一覧（`HistoryTimelineView`）、ストア状態管理、位置計算ユーティリティ

---

### 🔍 Code Review Findings

#### 📄 `src/components/history/HistoryTimelineView.tsx`

- **指摘内容:** フィルタ条件が `!existingNoteIds.has` から `existingNoteIds.has` に反転している。Issue #74 と無関係な変更に見え、仕様の意図確認が必要。
  - **変更前:** 削除済み付箋の履歴のみ表示（クリック不可）
  - **変更後:** 現存する付箋の履歴のみ表示（クリック可能）
  - 後者の方が UX として自然だが、削除済み付箋の履歴を残す仕様だった場合はリグレッションになる
- **推奨される修正案 (Code Diff):**
```ts
// 変更前 (Before) - 削除済み付箋の履歴を表示
- history = history.filter((h) => !existingNoteIds.has(h.note_id));

// 変更後 (After) - 現存付箋の履歴を表示（意図的なら別 Issue/コミットで明記）
+ history = history.filter((h) => existingNoteIds.has(h.note_id));
```
→ 意図的な修正なら PR 説明に記載し、Issue #74 とは別コミットに分離することを推奨

---

#### 📄 `src/hooks/useDragOnBoard.ts`

- **指摘内容 (中):** `getQuadrantFromPosition` が import されているが未使用。`findMergeTarget` 削除に伴うデッドコード。
- **推奨される修正案 (Code Diff):**
```ts
// 変更前 (Before)
- import { getQuadrantFromPosition, convertToBoardPercentages, getActiveNoteInfo } from '../utils/positionUtils';

// 変更後 (After)
+ import { convertToBoardPercentages, getActiveNoteInfo } from '../utils/positionUtils';
```

- **指摘内容 (中):** `onDragCancel` ハンドラがない。ドラッグをキャンセル（Esc 等）した場合、`activeCategory` が `handleDragEnd` までリセットされない可能性がある。
- **推奨される修正案 (Code Diff):**
```ts
// 変更後 (After) - useDragOnBoard.ts に追加
+ const handleDragCancel = useCallback(() => {
+   setActiveId(null);
+   setActiveCategory(null);
+ }, [setActiveCategory]);

// BoardContent.tsx
- <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
+ <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
```

- **指摘内容 (良い点):** マージ確認をキャンセルした際に付箋をドロップ位置へ移動する `else` 分岐の追加は、以前「何も起きない」状態より UX が改善されている。

- **指摘内容 (低):** `useDragOnBoard` のマージロジックにテストがない。`positionUtils.test.ts` は追加されているが、DnD フロー全体の回帰テストは未カバー。

---

#### 📄 `src/hooks/useBoardDnd.tsx`

- **指摘内容 (低):** `issue_74_update_v2.md` の「DragOverlay: マージ可能な対象のみ視覚フィードバックを反映」が未実装。`DragOverlay` は `isOverlay={true}` のみで、`activeCategory` / `isOver` を渡していない。
- **推奨される修正案 (Code Diff):**
```tsx
// 変更後 (After) - 必要であれば activeCategory を渡してオーバーレイ側でも反映
<StickyNoteView
  title={activeNote.title}
  category={activeNote.category}
  isOverlay={true}
  activeCategory={useStore.getState().activeCategory}
/>
```
→ ボード上の `isOver` フィードバックで十分なら、タスク仕様を「完了」に更新するか、要件を明確化すること

---

#### 📄 `src/components/sticky-note/StickyNoteView.tsx`

- **指摘内容 (低):** `h-20 md:h-20 max-md:h-[26px]` は `md:h-20` が冗長。`h-20 max-md:h-[26px]` で同等。
- **推奨される修正案 (Code Diff):**
```tsx
// 変更前 (Before)
- w-32 h-20 md:h-20 max-md:h-[26px] p-2 ...

// 変更後 (After)
+ w-32 h-20 max-md:h-[26px] p-2 ...
```

- **指摘内容 (良い点):** `canMerge = isOver && activeCategory === category` により、異カテゴリ接触時の誤ったホバー表示を防止できている。Issue #74 v2 の要件を満たしている。

---

#### 📄 `src/components/sticky-note/StickyNote.tsx`

- **指摘内容 (良い点):** `opacity: 0` を親から `StickyNoteView` の `draggingStyle` に移したのは適切。ドラッグ中の見た目管理が一箇所に集約されている。

---

#### 📄 `src/components/pending/PendingNoteItem.tsx`

- **指摘内容 (良い点):** `StickyNoteView` への共通化により、ボード付箋とペンディング付箋の見た目が統一された。`categoryEmojis` の重複定義も解消。

---

#### 📄 `src/store/useStore.ts`

- **指摘内容 (良い点):** `activeCategory` / `setActiveCategory` の追加はシンプルで、DnD 中の視覚フィードバック用途に適切。

---

#### 📄 `src/utils/positionUtils.ts` / `positionUtils.test.ts`

- **指摘内容 (低):** `containerSize === 0` のガードは追加されているが、テストに含まれていない。未使用だった `getViewportSize` の削除は妥当。
- **推奨される修正案 (Code Diff):**
```ts
// 変更後 (After) - positionUtils.test.ts に追加
+ it('returns 0 when container size is 0', () => {
+   expect(pixelsToPercentage(50, 0)).toBe(0);
+ });
```

---

#### 📄 `src/components/layout/HeaderMenu.tsx`

- **指摘内容 (低):** 設定ボタンから `bg-gray-50` を削除。Issue #74 と無関係なスタイル変更。意図がなければ元に戻すか、別コミットに分離することを推奨。

---

### 🚀 総合評価

**ステータス: 確認事項あり（条件付きマージ可能）**

Issue #74 のコア要件（パーセンテージ座標、接触ベースのマージ判定、カテゴリ一致時のみの視覚フィードバック、タブレット向け UI）は概ね達成されている。テスト 34 件もすべてパスしている。

マージ前に確認・修正を推奨する点:

1. **`HistoryTimelineView` のフィルタ反転** — Issue #74 と無関係。仕様意図の確認とコミット分離を推奨
2. **未使用 import の削除** (`getQuadrantFromPosition`)
3. **`onDragCancel` の追加** — `activeCategory` のリーク防止
4. **スコープ外の変更**（`HeaderMenu.tsx`）の意図確認

上記 1 と 4 が意図的であれば、マージ可能と判断できる。