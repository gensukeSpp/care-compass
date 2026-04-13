# Plan: Pending Box への付箋追加とリスト表示順序

## TL;DR
AddNoteForm で「保留」を選択した場合、`addPendingNote()` を呼び出して Pending Box に追加する。
同時に `addPendingNote()` と `addPendingNotes()` の配列操作を `push()` から `unshift()` に変更し、新しい付箋が最上部に表示されるようにする。

## 実装タスク

### Issue #1: AddNoteForm で「保留」を選択時に Pending Box へ直接追加

**修正ファイル:** `src/components/common/AddNoteForm.tsx`

**タスクリスト:**
- [ ] **1.1** useStore から `addPendingNote` をインポート
  - 現在: `const addNote = useStore((state) => state.addNote);`
  - 修正: `addPendingNote` も同様にインポート
  
- [ ] **1.2** `handleSubmit` 関数内に条件分岐を追加
  - `if (quadrant === 'pending')` チェックを追加
  - 真の場合: `addPendingNote(title, content, category)` を呼び出す
  - 偽の場合: 現在の `addNote(title, content, category, quadrant)` を呼び出す（既存動作維持）

- [ ] **1.3** 送信後の状態リセット処理の確認
  - フォーム送信後 `setTitle('')`, `setContent('')`, `setIsOpen(false)` が正しく実行されることを確認

- [ ] **1.4** ローカルテスト
  - AddNoteForm で「保留」を選択して付箋を追加
  - PendingDrawer に即座に表示されることを確認
  - ボードには表示されないことを確認

---

### Issue #2: Pending Box で新しい付箋が最上部に表示される

**修正ファイル:** `src/store/useStore.ts`

**タスクリスト:**
- [ ] **2.1** `addPendingNote` 関数を特定
  - `src/store/useStore.ts` 内で `addPendingNote` の実装を確認
  - 現在の配列追加方法を確認（`push()` か `unshift()` か）

- [ ] **2.2** `addPendingNote` 関数内で `push()` → `unshift()` に変更
  - 新しいノートが `state.pendingNotes` の先頭に追加されるようにする
  - 変更前: `state.pendingNotes.push(newNote)`
  - 変更後: `state.pendingNotes.unshift(newNote)`

- [ ] **2.3** `addPendingNotes` 関数（複数ノート追加用）の確認
  - MD ファイルのドロップインポート時に使用される関数を確認
  - 同様に配列追加方法を修正が必要か判断
  - 必要に応じて修正（ユーザーの意図に応じた表示順序ロジック）

- [ ] **2.4** `updateNoteStatus()` 関数の確認
  - Board 上の付箋を「保留」に移動する場合の処理を確認
  - `to: 'pending'` 時に新しくした付箋が最上部に追加されるか確認
  - 必要に応じて修正（`unshift()` への統一）

- [ ] **2.5** ローカルテスト
  - 複数の付箋を順番に Pending Box に追加
  - 各追加ごとに新しい付箋が最上部に表示されることを確認
  - ドラッグ操作で Board から Pending への移動でも同じ動作確認

---

### Issue #3: 統合テスト

**テスト項目:**
- [ ] **3.1** エンドツーエンドフロー
  - AddNoteForm で「保留」を選択 → PendingDrawer で最上部に表示

- [ ] **3.2** 複数付箋のシーケンステスト
  - 付箋A を追加 → 付箋B を追加 → 付箋B が付箋A より上に表示

- [ ] **3.3** ドラッグ&ドロップ連携テスト
  - Board 上の付箋を Pending に移動 → 最上部に表示されること確認

- [ ] **3.4** UI/UX の確認
  - フォーム送信後正しく閉じることを確認
  - PendingDrawer の表示が自然であることを確認

---

## 関連するさファイル
- `src/components/common/AddNoteForm.tsx` — Issue #1 修正対象
- `src/store/useStore.ts` — Issue #2 修正対象
- `src/components/pending/PendingDrawer.tsx` — 参照・検証用
- `src/components/pending/PendingNoteItem.tsx` — 参照用
- `src/types/index.ts` — 型定義確認用

## 実装の順序（推奨）
1. Issue #1 と Issue #2 は独立しており、並行実装可能
2. ただし Issue #1 の修正を先に完了してから Issue #2 をテストするとフロー全体を検証しやすい
3. Issue #3（統合テスト）は Issue #1 と Issue #2 の両方の修正完了後に実施

## 決定事項
- Pending Box の表示順序：新しいものが上（`unshift()` で実装）
- AddNoteForm の select に「保留」オプションは既に存在 → ロジック修正のみ
