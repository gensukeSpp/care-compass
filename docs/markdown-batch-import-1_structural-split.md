## Plan: Markdown Batch Import (1) - Structural Split & Multi-file

TL;DR: 1つの大きな報告書を「見出し」で分割して複数の付箋にする機能、および複数ファイルを一括でインポートする機能を実装します。これにより、人間が手動でメモを小分けにする手間を大幅に削減します。

**Steps**
1. **`useDropMdFile` の拡張**
   - 1ファイルのみの制限を解除し、`e.dataTransfer.files` 全体をループ処理可能にする。
   - 保留ボックス（Pending Box）への一括投入アクションを追加。
2. **Markdown パーサーの導入/自作**
   - `#` (H1) や `##` (H2) などの見出しを区切り文字として認識し、テキストを分割するユーティリティ `splitMdByHeader.ts` を作成。
   - 見出しを「タイトル」、その下の本文を「内容」として抽出。
3. **ストア連携**
   - 分割された各セクションを `pendingNotes` として `useStore` に一括登録。
   - インポート時の重複チェック（簡易）を実装。
4. **UI フィードバック**
   - 一括インポート中の進捗表示（例：「4件の付箋を作成しました」）。

**Relevant files**
- `src/hooks/useDropMdFile.ts` (ドロップ処理のループ化)
- `src/utils/readMdFile.ts` (ファイル読み込み)
- `src/utils/splitMdByHeader.ts` (新規: テキスト分割ロジック)
- `src/store/useStore.ts` (一括追加メソッド `addPendingNotes`)

**Verification**
1. 複数の `.md` ファイルをドロップし、すべて保留ボックスに登録されること。
2. 見出し（##）を含む1つのファイルをドロップし、見出しごとに分割された付箋が作成されること。
3. タイトルが空の場合や、本文のみの場合のフォールバックが機能すること。
