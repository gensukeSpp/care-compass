# SRP (単一責任の原則) レビュー: `BoardPage.tsx`

## 1. 責務の特定

`BoardPage` コンポーネントは、現在以下の複数の責務を担っています：

1.  **認証・ガード状態の管理 (Auth Guarding)**:
    - ログイン状態 (`isLoggedIn`) やプロファイル選択状態 (`currentProfileId`) を監視し、必要に応じて `/dashboard` へリダイレクトするロジック。
2.  **アプリケーション状態に応じたビューの切り替え (View Switching)**:
    - 未ログイン時の「ウェルカム画面」、ロード時の「スピナー」、メインの「ボード画面」という、性質の異なる3つの大きな状態の描画。
3.  **ドラッグ＆ドロップ (D&D) のインフラ設定**:
    - `sensors` (Mouse, Touch) の設定、および `DndContext` の提供。
4.  **ボード画面のレイアウト構成 (Orchestration)**:
    - `BoardReference`, `PendingDrawer`, `NoteModalTop`, `AddNoteForm`, `DragOverlay` を組み合わせたメインUIの構築。

## 2. SRP 違反の特定

以下の点が SRP に違反していると考えられます：

-   **ビジネスロジック (ガード) とプレゼンテーションの混在**:
    - 「ログインしていなければリダイレクトする」というルーティング/ガードの責務と、「ログイン画面を描画する」責務が一つのコンポーネントに同居しています。
-   **複数の「画面」の同居**:
    - `BoardPage` は本来「ボードを表示する」ためのコンポーネントであるべきですが、実際には「ログイン促進画面」としての役割も果たしています。これにより、変更の理由が「ログイン画面のデザイン変更」と「ボードの機能変更」の両方になってしまいます。
-   **D&D 設定の詳細の露出**:
    - センサーの距離設定 (`distance: 5`) や遅延設定 (`delay: 250`) などの低レベルな設定が、ページレベルのコンポーネントに含まれています。

## 3. 改善案の提示

### ① ガード・認証ビューの分離
`useAuthGuard` のようなカスタムフック、または `AuthGuard` ラッパーコンポーネントを導入し、`BoardPage` は「認証済みかつプロファイル選択済み」の状態のみを扱うようにします。

### ② ビューのコンポーネント化
「未ログイン画面」や「ロード画面」を個別のコンポーネント (`WelcomeView`, `LoadingView`) に抽出します。

### ③ D&D コンテキストの抽象化
`BoardDndContext` のようなラッパーを作成し、センサー設定や `DragOverlay` を隠蔽します。

---

### 改善後のイメージ (擬似コード)

```tsx
// src/components/board/BoardPage.tsx

export const BoardPage: React.FC = () => {
  // 1. ガードロジックは別の場所で処理されることを前提に
  // もしくは AuthGuard コンポーネントでラップする
  
  return (
    <AuthGuard fallback={<WelcomeView />} loading={<LoadingView />}>
      <ProfileGuard fallback={<Navigate to="/dashboard" />}>
        <BoardBoardContent />
      </ProfileGuard>
    </AuthGuard>
  );
};

// 責務を分離した内部コンポーネント
const BoardBoardContent: React.FC = () => {
  const { sensors, handleDragStart, handleDragEnd, activeOverlay } = useBoardDnd();

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative min-h-screen overflow-hidden bg-gray-50">
        <NoteModalTop />
        <AddNoteForm />
        <BoardReference />
        <PendingDrawer />
        {activeOverlay}
      </div>
    </DndContext>
  );
};
```

これにより、`BoardPage` は「どのような条件で何を表示するか」という高レベルの宣言に集中でき、各詳細（ログイン画面のデザイン、D&Dの感度、リダイレクト条件）はそれぞれの専門コンポーネント/フックに閉じ込めることができます。
