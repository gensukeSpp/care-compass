# [Feature] ボード設定画面の実装 (Board Settings UI)

## 目的
作成済みのボードに対して、象限ラベルの変更やプロファイル名の編集を可能にする設定画面を実装する。管理者（オーナー）やボードメンバーがボードをカスタマイズできるようにし、プロファイル更新をDB（RPC）に反映させる。

## 要件（issue #66 より）
- ダッシュボードまたはボード画面からアクセスできる「設定」ボタン/リンク
- プロファイル名（対象者名）の編集機能
- 象限ラベルの編集機能（既存 RPC `update_profile_labels` の呼び出し）
- ボード削除機能（オプション／要確認）

## UX / フロー
1. ボード画面のヘッダーに「設定」アイコンを追加（Header.tsx など）
2. モーダルまたは専用ページで設定画面を表示
3. プロファイル名、4象限ラベルを入力して保存
4. 保存時にフロントで最小バリデーションを行い、RPC を呼び出して永続化
5. 成功したらローカルストア（profiles、board metadata 等）を更新しUIに反映
6. 削除は確認ダイアログを表示、オーナーのみ実行可能にする

## 技術的実装ノート
- フロント：React + TypeScript で新規コンポーネント（例: components/board/BoardSettingsModal.tsx）を作成
- ルーティング／表示：モーダルもしくは pages/ に専用 Route を用意
- ストア：src/store/ にある profiles/board store を更新（useAuthStore でオーナー判定）
- API：既存 RPC `update_profile_labels` を呼び出す。エラーはユーザー向けにトースト表示
- 削除処理：必要なら Supabase のボード削除 RPC を利用。削除後はダッシュボードへリダイレクト

## 変更見積もり（目安）
- UI コンポーネント追加: 1–2日
- ストア連携 + RPC 呼び出し: 0.5–1日
- 削除機能（含む確認ダイアログ）: 0.5–1日
- テスト（ユニット＋E2E 簡易）: 0.5日

## 受け入れ基準
- ヘッダー／ダッシュボードから設定画面へ遷移できる
- プロファイル名と4象限ラベルを編集・保存でき、ページをリロードしても反映される
- 更新は RPC 経由で永続化され、他メンバーの画面でも更新が確認できる
- 削除機能を実装した場合、オーナーのみ操作可能で確認ダイアログがある

## 関連ファイル（編集候補）
- src/components/layout/Header.tsx
- src/pages/BoardPage.tsx (またはボード表示コンポーネント)
- src/components/board/BoardSettingsModal.tsx (新規)
- src/store/useProfileStore.ts (または該当 store)
- src/lib/supabase.ts / services 用 RPC 呼び出しラッパー

## ブランチ案
現 branch のままで OK

## テスト/QA メモ
- profiles のラベル変更が UI と DB 両方で整合していることを確認
- 権限（オーナー判定）が正しく効いていることを確認
- ネットワークエラー時にユーザーへ適切なフィードバックが出ること

---

作業タスクはリポジトリ直下の `tasks/66-board-settings-tasks.md` を参照してください。