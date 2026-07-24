# SRP Review: MainLayout.tsx

## 1. 責務の特定
`MainLayout` コンポーネントが現在担っている責務は以下の通りです：

1.  **レイアウト構造の定義**: ヘッダー、メインコンテンツエリア（`Outlet`）、モーダル等の全体的な配置を定義。
2.  **ナビゲーション・ガード**: ログイン中かつプロファイル未選択の場合にダッシュボードへリダイレクトするロジックの管理。
3.  **認証・プロファイル状態の導出**: `useAuthStore` から情報を取得し、現在のプロファイルやオーナー権限の有無を判定。
4.  **ナビゲーションUIの制御**: 「ボード一覧」リンクや「招待」ボタンの表示条件判定と、リンク押下時のプロファイル選択解除処理。
5.  **外部機能の統合**: Web Share Target API の処理（`useWebShareTarget`）の実行。
6.  **招待モーダルの状態管理**: 招待モーダルの開閉状態管理とコンポーネントの配置。

## 2. SRP 違反の特定
`MainLayout` は「アプリケーションの外殻を定義する」という本来の役割を超えて、以下の箇所で SRP 違反が見られます。

*   **ビジネスロジック（リダイレクト）の混在**:
    「プロファイルがなければダッシュボードへ戻す」というビジネスルールがレイアウトコンポーネント内に直接記述されています。これは、プロファイル選択が必須となるページが増えた際や、リダイレクト条件が変わった際にレイアウトコンポーネントを変更しなければならない理由になります。
*   **モーダル管理の責務**:
    特定の機能（招待）に紐づくモーダルの状態管理とレンダリングが含まれています。これは、新しいモーダルが増えるたびに `MainLayout` が肥大化する原因となります。
*   **複雑なヘッダー内UIロジック**:
    ロゴ表示、プロファイル名表示、リンクの活性状態判定、権限によるボタン表示などのロジックが `MainLayout` 内でインライン展開されています。

## 3. 改善案の提示

### ① ナビゲーション・ガードの抽出
リダイレクトロジックをカスタムフック `useProfileRedirect` に抽出、または `ProfileGuard` コンポーネントを作成して `Outlet` をラップする形式にします。

### ② ヘッダーUIのコンポーネント化
現在 `MainLayout` 内に記述されているヘッダー部分を `Header` コンポーネントに統合するか、`GlobalNav` コンポーネントとして独立させます。

### ③ 招待機能の独立
招待ボタンとモーダルを `InviteButton` という一つのコンポーネントにまとめ、必要な権限チェックもその中で行います。

---

### 改善後のイメージ例

#### `src/components/layout/MainLayout.tsx`
```tsx
export function MainLayout() {
  // 構造の定義と外部統合のみに集中
  useWebShareTarget();
  useProfileRedirect(); // 抽出したガードロジック

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
```

#### `src/components/layout/Header.tsx`（責務を移行）
```tsx
export function Header() {
  const { isLoggedIn, currentProfile, isOwner } = useHeaderState(); // 状態取得を分離

  return (
    <header className="...">
      <Logo profileName={currentProfile?.name} />
      <div className="flex items-center gap-2">
        {isLoggedIn && <DashboardLink />}
        {isLoggedIn && isOwner && <InviteAction profile={currentProfile} />}
      </div>
      <UserMenu />
    </header>
  );
}
```

このように分離することで、`MainLayout` は「全体構造」に、`Header` は「ナビゲーション」に、ガードロジックは「遷移ルール」に、それぞれ独立して変更を加えることが可能になります。
