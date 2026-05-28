# Tasks for Issue #66 — Board Settings UI

Branch: feature/customize-quadrant/66

- [ ] 1. ヘッダーに「設定」ボタンを追加
  - 変更箇所: src/components/layout/Header.tsx
  - 注: ダッシュボードからもアクセス可能にする

- [ ] 2. BoardSettings コンポーネント作成（モーダルまたはページ）
  - 新規: src/components/board/BoardSettingsModal.tsx
  - 入力項目: プロファイル名（対象者名）、4象限ラベル（text ×4）
  - UX: 保存 / キャンセル / デフォルトに戻す

- [ ] 3. ストア連携と RPC 呼び出し
  - 参照/更新箇所: src/store/useProfileStore.ts（既存の store 名に合わせる）
  - RPC: update_profile_labels を呼び出して永続化
  - エラー処理: トースト表示、ロールバック不要（入力は上書き）

- [ ] 4. 権限チェック（オーナーのみ削除等）
  - useAuthStore から currentUser / roles を参照
  - 削除ボタンはオーナーのみ表示

- [ ] 5. ボード削除（任意／要確認）
  - 実装する場合: 確認ダイアログ + サーバー側削除 RPC の呼び出し
  - 削除成功後: ダッシュボードへ遷移

- [ ] 6. テスト
  - ユニット: コンポーネントの保存処理、ストア連携
  - E2E/統合: 設定が保存され他ユーザーに反映される流れ

- [ ] 7. ドキュメント更新
  - docs/66-board-settings-plan.md を参照
  - 出来れば CHANGELOG に短いエントリを追加

Notes:
- まずは「編集・保存」フロー（RPC 呼び出し含む）を最小実装で出し、削除は後追いで良い。
- 小さめのPRに分割（例: ヘッダー追加 + モーダル UI、RPC 接続）を推奨。