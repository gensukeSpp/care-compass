## Plan: Google Keep Drawer / Pending Box

TL;DR: Phase 2 を2段階に分ける提案は妥当です。1) Pending Box UI +内部ドラッグ＆ドロップ/マージ機能を先行し、2) その後Google Keep認証とAPI同期を組み込みます。追加実装を段階的に進めることで早期動作確認とリスク低減が可能です。

**Steps**
1. 既存Notes型とストアを調査（完了）
2. 型拡張（statusに pending 追加）
3. ストア拡張（pendingNotes、管理メソッド）
4. UI追加：`PendingDrawer` / `PendingNoteItem`（右スライド/閉じる）
5. ドラッグ＆ドロップの経路設計
   - Board上からPendingへ
   - PendingからBoardへ
   - Board上の既存ノートにPendingをドロップ→マージ
6. PendingBoxでMarkdown貼り付け/Keepインポートを設計
   - 現状の `useDropMdFile` を再利用
   - `Pending` 初期生成UI
7. Google Keep integration: 
   - `src/services/googleKeepService.ts` 新規（APIクライアント）
   - OAuth 2.0認証画面＋トークン管理
   - Keepノート取得→`pendingNotes`に変換
8. QA/テスト（ユニットと手動）

**Relevant files**
- `src/types/index.ts`（Note型、status enum、pending型）
- `src/store/useStore.ts`（state: pendingNotes / actions）
- `src/components/board/Board.tsx`（ドラッグ領域拡張）
- `src/hooks/useDragOnBoard.ts`（ドラッグ挙動拡張）
- `src/hooks/useDropMdFile.ts`（Markdownドロップ→pending送信）
- `src/components/pending/PendingDrawer.tsx`（新規）
- `src/components/pending/PendingNoteItem.tsx`（新規）
- `src/services/googleKeepService.ts`（新規）

**Verification**
1. pendingNotesでボードと保留が共存すること
2. 保留からボードに移動/board内でマージ可能
3. Google Keep認証からインポートされてpendingへ登録
4. ストアとUIが一貫して反映されること
5. テストのカバレッジ：`useStore`のmutationとPendingDrawer UI挙動

**決定 (提案)**
- 先に「Pending Box + 既存内部挙動（ドラッグ、マージ、Markdown貼付け）」を完成させる
- その後、Google Keep認証/取得を接続（認証が絡むなら別タスクとして明確）
- 依存関係は低いので、2フェーズ工程で進めやすい

**ユーザー確認事項（確定）**
1. Phase 2A（Pending Box） → Phase 2B（Google Keep） の分離 ✅
2. Pending Box 右側固定スライド式 UI ✅
3. マージ方式A選択：Pending → Board ドロップ → モーダル編集 → 既存ノートにドロップでマージ ✅

**Further considerations**
1. Google Keep API のアクセス範囲と利用規則を確認済みか
2. Pendingノートの仕様：status保持、期限、削除、カテゴリ付与の要件
3. 既存Historyロギングに pending 追加をどう統合するか
