# SRP Review Report: `src/App.tsx`

- **Date:** 2026-05-11
- **Reviewer:** Gemini CLI
- **Status:** SRP Violation Identified

---

## 1. 責務の特定 (Responsibilities)

`App` コンポーネントは、現在以下の 5 つの異なる責務を担っています：

1.  **ルーティング設定 (Routing Configuration)**: `react-router-dom` を使用したパスとコンポーネントのマッピング定義。
2.  **認証状態のグローバル監視と制御 (Auth Lifecycle & Guarding)**: アプリ起動時の認証チェック (`checkAuth`) および、プロファイル未選択時のダッシュボードへの強制リダイレクト。
3.  **外部インテグレーション (Web Share Target)**: PWA の共有ターゲット機能として、URL パラメータから共有内容を抽出して `PendingNote` に追加するロジック。
4.  **共通ヘッダーの UI 定義 (Header UI)**: ロゴ、プロファイル表示、ボード一覧リンク、ユーザー情報、ログイン/ログアウトボタンの配置とスタイル。
5.  **ルートレイアウト構造 (Root Layout)**: ヘッダーとメインコンテンツエリアの全体的な配置構造。

## 2. SRP 違反の特定 (SRP Violations)

`App.tsx` は「アプリケーションのルート」という名目のもと、複数の独立した変更理由を抱え込んでいます。

-   **UI と ロジックの混在**: ヘッダーという特定の UI 構造と、Web Share や認証リダイレクトといったドメインロジックが同じファイルに記述されています。
-   **グローバルな関心事の集中**: 本来 `Layout` や `Guard`、`Provider` 的な役割が分割されているべき箇所が、すべてトップレベルの関数に詰め込まれています。
-   **テストの困難さ**: Web Share のロジックだけをテストしたり、ヘッダーの表示だけを確認したりすることが難しく、肥大化したコンポーネント全体のレンダリングが必要になります。

## 3. 改善案の提示 (Proposed Improvements)

責務を以下のように分離することを提案します。

### A. ヘッダーの抽出 (`Header` コンポーネント)
ヘッダー部分を独立したコンポーネントに切り出します。

```tsx
// src/components/layout/Header.tsx
export const Header = () => {
  // ... current header logic & JSX
};
```

### B. レイアウトの抽出 (`MainLayout` コンポーネント)
全体の枠組みを定義するレイアウトコンポーネントを作成し、`Outlet` (react-router) を使用します。

```tsx
// src/components/layout/MainLayout.tsx
export const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 relative overflow-hidden">
      <Outlet />
    </main>
  </div>
);
```

### C. Web Share ロジックのフック化 (`useWebShareTarget`)
副作用として実行されている Web Share 処理をカスタムフックに隔離します。

```ts
// src/hooks/useWebShareTarget.ts
export const useWebShareTarget = () => {
  useEffect(() => {
    // ... current share logic
  }, []);
};
```

### D. 認証ガードの分離 (`AuthGuard`)
リダイレクトロジックをラップするコンポーネント、またはフックに移行します。

---

## 結論

`src/App.tsx` を「宣言的なルーティング定義のみ」を行うスリムなエントリーポイントにし、UI 部品やビジネスロジックはそれぞれの専門コンポーネント/フックに委譲すべきです。
これにより、メンテナンス性とテスト容易性が大幅に向上します。
