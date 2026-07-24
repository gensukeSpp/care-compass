# SRP Review: src/components/common/CreateProfileModal.tsx

## 1. 責務の特定
このコンポーネントは現在、以下の複数の責務を負っています。

1. **モーダルのUI表示**: モーダルの枠組み、オーバーレイ、閉じるボタンなどの視覚的な表現。
2. **フォーム状態管理**: 対象者の名前（name）および象限ラベル（labels）の入力状態の保持。
3. **ビジネスロジックの実行**: `useAuthStore` を使用してプロフィール作成をリクエストし、成功時のリダイレクトやエラーハンドリングを行う。
4. **フォームレイアウトとバリデーション**: ユーザーへの入力を促すUI構造と、基本的なバリデーション（`!name.trim()`）。

## 2. SRP 違反の特定
このコンポーネントは **「UIのレンダリング」** と **「ビジネスロジックの管理（プロフィール作成プロセスの調整）」** という、全く異なる2つの責務を混合しています。

- **違反点**: プロフィール作成というビジネスプロセスに深く結びついたロジック（`createProfile` の呼び出し、リダイレクト、エラーの表示）がコンポーネント自体に直接記述されています。これにより、モーダルの見た目だけを変えたい場合や、プロフィール作成のロジックを変えたい場合に、両方に影響が及ぶコードとなっています。

## 3. 改善案の提示

コンポーネントの責任をUI表示に限定し、ビジネスロジックをカスタムフックまたはより上位のコンポーネントへ委譲します。

### 提案: 責任の分離
1. **`useCreateProfile` フックの作成**: プロフィール作成に関連するロジック（`handleSubmit`, ステートの管理）をカスタムフックへ分離。
2. **UIコンポーネントの純粋化**: `CreateProfileModal` は渡された関数（プロパティ）を呼び出すだけのUIコンポーネントにする。

#### コード改善例

**フックの抽出 (`src/hooks/useCreateProfile.ts`):**
```typescript
export const useCreateProfile = (onSuccess: () => void) => {
  const [name, setName] = useState('');
  // ...ラベル管理など
  const createProfile = useAuthStore(s => s.createProfile);
  
  const submit = async () => {
    await createProfile(name, labels);
    onSuccess();
  };
  
  return { name, setName, labels, setLabels, submit, isLoading, error };
};
```

**コンポーネントの簡略化:**
```typescript
export const CreateProfileModal = ({ onClose }) => {
  const { name, setName, labels, setLabels, submit, ... } = useCreateProfile(onClose);
  // UIレンダリングに専念
};
```

これにより、`CreateProfileModal` はモーダルのレイアウト維持だけに責任を持つようになり、ロジックの変更がUI定義に影響を与えない疎結合な設計が実現できます。
