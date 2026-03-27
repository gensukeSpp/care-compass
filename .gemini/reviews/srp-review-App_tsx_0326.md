# SRP Review: `src/App.tsx`

## 1. 責務の特定 (Responsibilities)

`App` コンポーネントは、現在以下の 5 つの異なる責務を担っています：

1.  **ルートレイアウトの構成 (Root Composition)**: `NoteModal` や `AddNoteForm` を配置し、アプリケーションの全体構造を定義している。
2.  **ウィンドウ・リサイズ管理 (Window Management)**: `useEffect` を用いてブラウザのリサイズを監視し、ボードのコンテナサイズを `Zustand` ストアに同期している。
3.  **ドラッグ＆ドロップの座標計算 (D&D Logic & Coordinate Conversion)**: `handleDragEnd` 内で、ピクセル単位の移動量をパーセンテージ（比率）座標に変換するロジックを保持している。
4.  **4象限グリッドの UI 定義 (Grid UI Definition)**: 背景となる十字線や「できる」「できない」といったラベルの配置をハードコードしている。
5.  **付箋リストのレンダリング (Note List Rendering)**: `notes` 配列を `map` して `StickyNote` コンポーネントを生成・配置している。

---

## 2. SRP 違反の特定 (SRP Violations)

### A. UI レイヤとビジネスロジックの混在
`handleDragEnd` における「px を % に変換してストアを更新する」という計算ロジックは、純粋な表示ロジックではありません。これはボードの「座標システム」というビジネスルールの一部であり、`App.tsx` というビューのトップレベルにあるべきではありません。

### B. グリッドのハードコーディング
`設計書.md` では将来的に「別の軸（緊急度×重要度など）」に変更できる柔軟性が求められていますが、現在の `App.tsx` には 4 象限の枠組みが直接書き込まれています。枠組みを変更する際に `App.tsx` 自体を修正しなければならず、「変更する理由」が複数存在してしまっています。

### C. リサイズ管理の結合
コンテナサイズの計測とストアへの通知は、ボードの描画ロジックとは独立したインフラ的な責務です。

---

## 3. 改善案の提示 (Proposed Improvements)

責務を以下の 3 つの新しいコンポーネント/フックに分割することを提案します。

### 1. `Board` コンポーネントの抽出
ドラッグ＆ドロップのコンテキスト管理と付箋のレンダリングを `src/components/board/Board.tsx` に移動します。

```tsx
// src/components/board/Board.tsx (イメージ)
export function Board() {
  const { notes, handleDragEnd } = useBoardLogic(); // D&Dロジックを分離

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <BoardBackground type="4-quadrant" /> {/* グリッドを抽象化 */}
      <DndContext onDragEnd={handleDragEnd}>
        {notes.map(note => <StickyNote key={note.id} {...note} />)}
      </DndContext>
    </div>
  );
}
```

### 2. `BoardBackground` コンポーネントの作成
背景の十字線とラベルを分離し、将来的に「軸」を切り替えられるようにします。

```tsx
// src/components/board/BoardBackground.tsx
export function BoardBackground({ type }: { type: '4-quadrant' | 'priority' }) {
  if (type === '4-quadrant') {
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className="...">できる</div>
        {/* ... */}
      </div>
    );
  }
  return null;
}
```

### 3. `useWindowSize` カスタムフックの導入
リサイズ監視ロジックを抽出し、`App` の責務を「構成」のみに絞ります。

```tsx
// src/hooks/useContainerResize.ts
export function useContainerResize() {
  const setContainerDimensions = useStore(s => s.setContainerDimensions);
  useEffect(() => {
    const updateSize = () => setContainerDimensions(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [setContainerDimensions]);
}
```

### 4. 修正後の `App.tsx`
`App` はアプリケーションの構成要素を配置するだけのシンプルなコンポーネントになります。

```tsx
function App() {
  useContainerResize(); // 責務を委譲

  return (
    <div>
      <NoteModal />
      <AddNoteForm />
      <Board /> {/* 詳細な描画とロジックは Board へ */}
    </div>
  );
}
```
