# 実装プラン: Google Tasks -> Pending Box 一括取り込み拡張

目的
- Pending Box の「Refresh」アイコンを「Google Tasks」ボタンに置換し、ユーザーが特定の Tasks リストを選んでタスクを選択・取り込みできるようにする。

現状の解析（リポジトリ内で確認した箇所）
- src/components/pending/PendingDrawer.tsx: 現行の RefreshCw アイコン、Google Tasks 同期処理の呼び出しやエラーハンドリングがある。
- src/services/tasksSyncService.ts: Google Tasks 同期用サービスの実装が存在。
- src/workers/auth.ts: Worker 側での Google 認証 / token refresh ロジックが実装されている。
- 関連ドキュメント: docs/* に Pending Box と Google Keep/Tasks に関する設計メモがある。

提案する実装アプローチ（段階的）
1. UI 変更（軽量）
   - PendingDrawer の Refresh アイコンを「Google Tasks」ボタンに置換。
   - クリックで新しいモーダル（TasksModal）を開く。
   - TasksModal は 2 ステップ表示: タスクリスト一覧 -> 選択したリストのタスク一覧。
2. TasksModal コンポーネント
   - コンポーネント位置: src/components/pending/TasksModal.tsx
   - 機能: タスクリスト取得、リスト選択、タスクのチェックボックス選択、取り込みボタン、キャンセル。
   - アクセシビリティ/レスポンシブを考慮。
3. データ取得/インポート
   - 既存の tasksSyncService と /worker 認証エンドポイントを再利用（推奨）。
   - タスクを Pending Note に変換するマッピング: title -> title, notes/description -> content (Markdown), due/metadata -> history やタグ（必要に応じて）。
   - インポート時は Pending Box に prepend（既存の動作に合わせる）。
4. エラー処理 / UX
   - 認証エラー時の状態遷移（ログイン促し、再認証フロー誘導）。
   - ローディング、部分インポート、重複チェック（ID ベース）を検討。

主な変更ファイル（予定）
- src/components/pending/PendingDrawer.tsx  (ボタン変更、クリックハンドラ)
- src/components/pending/TasksModal.tsx     (新規)
- src/components/pending/PendingNoteItem.tsx (必要に応じて取り込みハンドラ)
- src/services/tasksSyncService.ts          (既存を利用/必要な拡張)
- src/store/useStore.ts                     (Pending Box 追加 API がここにあるなら利用)
- src/workers/auth.ts                       (既存の worker を利用)

TODO（実装タスク、後続で SQL に反映済）
- pending-google-tasks-ui: PendingDrawer の UI 変更と Tasks ボタン追加
- tasks-modal-component: TasksModal の作成（リスト取得 / タスク選択 / インポート）
- tasks-fetch-and-import: tasksSyncService を使った取得と Pending Box へのマッピング・追加
- auth-integration: Worker 認証の利用とエラーハンドリング

留意点 / 開発順序（推奨）
1. 既存サービスを用いたプロトタイプ（フロントでモーダル→API 呼び出し）を作成して早期動作確認
2. 認証やエラー周りを堅牢化
3. UX 改善（重複チェック、部分取り込み、インポート履歴）

次の確認事項（1つ質問します）
- 既存の tasksSyncService と worker ベースの認証を再利用しますか？（推奨）
  - 既存サービスを再利用 (Recommended)
  - 新規にフロントエンド OAuth フローを実装する


(このプランの詳細や優先度変更があれば回答ください。)