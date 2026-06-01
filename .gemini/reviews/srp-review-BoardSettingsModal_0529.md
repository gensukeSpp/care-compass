# SRP Review: `BoardSettingsModal.tsx`

## 1. 責務の特定 (Responsibility Analysis)
現在の `BoardSettingsModal.tsx` は、以下の責務を混在させています。

1.  **UI 表示:** モーダルのオーバーレイ、構造、入力フィールドのレンダリング。
2.  **ビジネスロジックの実行:** 
    - Supabase への直接的なデータ保存・更新 (Profileテーブル)。
    - ボード削除のための状態遷移ロジック (`handleDelete`)。
    - 入力のバリデーションロジック。
3.  **状態管理のオーケストレーション:** Zustand ストア (`useAuthStore`) とのインタラクション。
4.  **画面遷移の制御:** `useNavigate` を使った削除後のルーティング制御。

## 2. SRP 違反の特定 (SRP Violations)

コンポーネントが「UIの表示」と「データ操作/ビジネスルール/画面遷移」という異なるドメインの責務を同時に担っています。

- **違反:** コンポーネントが Supabase への `update` を直接呼び出しており、データアクセスの詳細を知りすぎている。
- **違反:** `handleDelete` 内で削除ロジック、確認ダイアログ、画面遷移までを一括で行っており、削除プロセスがコンポーネントに強く結合されている。
- **違反:** バリデーションやデフォルトラベルの設定といったビジネスルールがUI層に漏出している。

## 3. 改善案 (Improvement Proposals)

### 3.1. データ・ロジック層の分離 (Custom Hook の抽出)
データ操作とビジネスロジックを `useBoardSettings` などのカスタムフックに抽出し、コンポーネントを「データを受け取って表示・イベントを送る」だけの薄いUI層に変換します。

```tsx
// 抽出イメージ: src/hooks/useBoardSettings.ts
export function useBoardSettings(profile: Profile) {
  const [isSaving, setIsSaving] = useState(false);
  const save = async (data: SettingsData) => { /* ... */ };
  const remove = async () => { /* ... */ };
  return { isSaving, save, remove };
}
```

### 3.2. コンポーネントの分割
モーダルの「設定フォーム部分」と「ボタンコントロール部分」を分離することで、責務を明確にします。

### 3.3. 削除ロジックの抽象化
`handleDelete` は `onDelete` プロパティとして外部から注入可能にし、コンポーネントは「削除ボタンをクリックした」という事実を親に通知するだけにします。ルーティングや確認ダイアログの制御をコンポーネント内から取り除くことで、コンポーネントのテスト容易性と再利用性が向上します。
