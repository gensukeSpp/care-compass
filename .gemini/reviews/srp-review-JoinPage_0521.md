# 単一責任の原則 (SRP) レビュー: JoinPage.tsx

## 1. 責務の特定

`JoinPage` コンポーネントは現在、以下の責務を担っています：

1.  **URLパラメータの管理**: `searchParams` から `token` を抽出し、存在チェックを行う。
2.  **認証状態に応じたフロー制御**: ログイン済みかどうかに基づいて、ログインボタンを表示するか参加処理を開始するかを判断する。
3.  **招待参加のビジネスロジック**: `acceptInvitation` を呼び出し、その成否に応じた状態（`status`, `errorMessage`, `profileId`）を管理する。
4.  **自動遷移のタイマー管理**: 参加成功後の3秒待機と、コンポーネントアンマウント時のクリーンアップを行う。
5.  **UI レンダリング（複数状態）**: 待機中、処理中、成功、エラーの4つの異なる画面状態のマークアップをすべて保持している。
6.  **ナビゲーション**: 手動・自動でのページ遷移処理。

## 2. SRP 違反の特定

以下の箇所において、複数の独立した責務が結合されています：

-   **ロジックと表示の混在**: `handleJoin` 内で「招待の受諾」「状態更新」「タイマー設定」「ナビゲーション」が密に結合しており、ロジックのみをテストしたり再利用したりすることが困難です。
-   **肥大化したレンダリング関数**: 1つのコンポーネントが、ログイン誘導、ローディング、成功報告、エラー表示という本質的に異なる4つのビューの責務をすべて負っています。
-   **サイドエフェクトの直接管理**: タイマーの `setTimeout` と `clearTimeout` を UI コンポーネントが直接管理しており、遷移ロジックの変更が UI コンポーネントの変更を強制します。

## 3. 改善案の提示

責務を以下のように分離することを提案します：

### ① ビジネスロジックをカスタムフック `useInvitationJoin` に抽出
URLトークンの検証から参加処理、自動遷移のトリガーまでをカプセル化します。

```typescript
// src/hooks/useInvitationJoin.ts (イメージ)
export const useInvitationJoin = (token: string | null) => {
  const [status, setStatus] = useState<JoinStatus>('idle');
  const acceptInvitation = useAuthStore(state => state.acceptInvitation);
  // ...タイマーや状態管理ロジック

  const join = useCallback(async () => {
    // 参加処理の実装
  }, [token, acceptInvitation]);

  return { status, errorMessage, join, ... };
};
```

### ② 表示用コンポーネントの分割
各状態に応じたビューを独立した関数コンポーネントとして切り出します。

-   `JoinLoginView`: ログインを促す画面
-   `JoinProcessingView`: ローディング画面
-   `JoinSuccessView`: 成功メッセージと自動遷移の案内
-   `JoinErrorView`: エラーメッセージとリカバリ

### ③ コンテナコンポーネントとしての `JoinPage`
`JoinPage` はデータの取得（URLから）と、状態に応じたコンポーネントの切り替えのみに専念させます。

```tsx
export const JoinPage: React.FC = () => {
  const token = useTokenFromUrl();
  const { status, join, ... } = useInvitationJoin(token);

  if (!token) return <JoinInvalidUrlView />;

  switch (status) {
    case 'processing': return <JoinProcessingView />;
    case 'success': return <JoinSuccessView profileId={profileId} />;
    case 'error': return <JoinErrorView message={errorMessage} />;
    default: return <JoinLoginView onLogin={login} />;
  }
};
```

### 期待される効果
-   **テストの容易性**: `useInvitationJoin` フックを単体テストできるようになります。
-   **保守性の向上**: UI の微調整（アイコンの変更など）の際に、複雑なビジネスロジックを触る必要がなくなります。
-   **可読性の向上**: メインコンポーネントの見通しが良くなり、全体のフローが把握しやすくなります。
