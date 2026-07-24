# SRP Review: InviteModal.tsx

## 1. 責務の特定
`InviteModal` コンポーネントは、現在以下の責務を担っています：

1.  **UIのレンダリング**: モーダルの枠組み、タイトル、閉じるボタン、QRコード、リンク表示、共有ボタンなどの表示。
2.  **表示状態の管理**: モーダルの開閉（props経由）、読み込み中状態、エラー状態、コピー完了状態などの管理。
3.  **データ永続化（API通信）**: Supabase SDKを直接使用した `invitations` テーブルへのインサート処理。
4.  **ビジネスロジック**: 招待トークンの有効期限（24時間）の決定、招待URLの構築。
5.  **外部API/機能の利用**: ブラウザの `navigator.clipboard` によるコピー処理、および `navigator.share` による共有処理。

## 2. SRP 違反の特定
以下の点が SRP 違反として指摘されます：

-   **ドメインロジック/データアクセスとの混在**: コンポーネントが `supabase` クライアントを直接持ち、DB操作（`insert`）やビジネスルール（有効期限の設定）を行っています。これにより、UIの変更（デザイン調整）とデータ仕様の変更（テーブル構造やAPIの変更）のどちらの理由でもこのファイルが修正されることになります。
-   **ユーティリティロジックの抱え込み**: クリップボードへのコピーやWeb Share APIの利用は、他のコンポーネントでも再利用可能な汎用的な機能ですが、コンポーネント内に閉じ込められています。

## 3. 改善案の提示

### ① データの操作をサービスまたはカスタムフックに抽出する (`useInvitation`)
SupabaseへのアクセスとURL生成ロジックを分離します。

```typescript
// src/hooks/useInvitation.ts
export const useInvitation = (profileId: string) => {
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInvite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 招待リンク生成のビジネスロジックとAPI呼び出しをここに集約
      const { data, error: insertError } = await supabase.from('invitations')...
      if (insertError) throw insertError;
      const url = `${window.location.origin}/join?token=${data.token}`;
      setInvitationUrl(url);
    } catch (err) {
      setError('招待リンクの生成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return { invitationUrl, isLoading, error, generateInvite };
};
```

### ② 共有/コピーロジックを抽出する (`useShare`)
ブラウザ固有の機能を分離します。

```typescript
// src/hooks/useShare.ts
export const useShare = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async (data: ShareData) => {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await copyToClipboard(data.url || '');
    }
  };

  return { copied, copyToClipboard, share };
};
```

### ③ `InviteModal` をピュアなプレゼンテーションに近づける
抽出したフックを使用することで、`InviteModal` は「どのような情報をどのように表示するか」というUIの責務に集中できます。

```typescript
export const InviteModal: React.FC<InviteModalProps> = ({ ... }) => {
  const { invitationUrl, isLoading, error, generateInvite } = useInvitation(profileId);
  const { copied, share } = useShare();

  // JSXのみに集中
  return (
    // ...
  );
};
```

これにより、コンポーネントは「データの取得方法」や「共有の仕組み」を気にする必要がなくなり、純粋に「招待画面の見た目」に責任を持つようになります。
