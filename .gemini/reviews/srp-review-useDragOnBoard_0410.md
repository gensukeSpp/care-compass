# SRP 厳格レビュー: `src/hooks/useDragOnBoard.ts`

このレビューでは、単一責任の原則 (Single Responsibility Principle - SRP) の観点から、`useDragOnBoard.ts` (内包されている `useBoardLogic` フック) の設計を詳細に分析します。

## 1. 責務の特定

現在の `useBoardLogic` フックは、以下の「変更する理由」を複数抱えています：

1.  **ドラッグ中の UI 状態管理**: どのアイテムがドラッグされているか (`activeId`) を管理する。
2.  **dnd-kit のイベントオーケストレーション**: `DragStart` および `DragEnd` イベントの全体的な流れを制御する。
3.  **幾何学的計算と空間変換**: ビューポート座標からボード上のローカル座標への変換、境界内へのクランプ (Clamp)、パーセント座標への変換。
4.  **直接的な DOM 依存**: `.four-quadrant-board` というクラス名に依存した DOM クエリ。
5.  **ノートの型判別とデータ抽出**: `active.data` からのメタデータの読み取りと、ボード上のノートか保留中のノートかの判定。
6.  **マージ戦略 (ビジネスルール)**: 「同じ象限かつ同じカテゴリーならマージする」という、アプリケーション固有のマージ条件の判定。
7.  **Store との連携**: 最終的なデータの永続化 (更新、移動、マージ) の実行。

## 2. SRP 違反の指摘

以下の箇所が、2つ以上の独立した責務を担っており、SRP に違反していると判断します。

-   **低レベル計算と高レベルロジックの混在**: `handleDragEnd` 内で、ピクセル単位の座標計算 (`noteCenterX - boardRect.left`) と、「マージするか移動するか」というビジネスロジックが同じ関数内に記述されています。
-   **DOM 構造への密結合**: `document.querySelector` を用いて特定の要素を探しており、UI の構造（クラス名の変更など）がフックのロジックに直接影響を与えます。
-   **複雑なマージ条件判定**: ターゲットノートを探すロジック (`notes.find(...)`) が複雑化しており、マージのルールが変わるたびにこのフック全体を修正・再テストする必要があります。

## 3. 改善案の提示

### ① 責務の分離案

1.  **`useBoardGeometry` (幾何計算の抽出)**:
    - ボードの要素 (`ref`) を受け取り、ピクセル座標を正規化されたパーセント座標に変換する責務を担います。
2.  **`useDragActiveState` (UI状態の抽出)**:
    - `activeId` の管理のみを切り出します。
3.  **`getMergeTarget` (ビジネスロジックの抽出)**:
    - 座標とカテゴリーからマージすべきノートを特定するロジックを、Store または独立した純粋関数に移動します。
4.  **`useBoardDragHandlers` (オーケストレーター)**:
    - 上記のパーツを組み合わせ、dnd-kit のイベントをハンドリングすることに集中します。

### ② 具体的なコード例 (リファクタリング後)

```typescript
// src/hooks/useDragOnBoard.ts (リファクタリング後のイメージ)

export const useBoardLogic = (boardRef: React.RefObject<HTMLElement>) => {
  const { notes, updateNotePositionAndStatus, moveToBoard, mergeNotes } = useStore();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // 1. 幾何計算の責務を分離
  const calculatePosition = useCallback((rect: ClientRect) => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    
    // 座標変換ロジックを外部関数 (positionUtils等) に委譲
    return convertToBoardPercentages(rect, boardRect);
  }, [boardRef]);

  // 2. マージ判定の責務を分離 (Store 側に持たせるのが理想的)
  const findMergeTarget = useCallback((note: Note, x: number, y: number) => {
    const quadrant = getQuadrantFromPosition(x, y);
    return notes.find(n => 
      n.id !== note.id && 
      n.status === quadrant && 
      n.category === note.category
    );
  }, [notes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    const pos = calculatePosition(active.rect.current.translated);
    if (!pos) return;

    const { activeNote, isPending } = getActiveNoteInfo(active, notes); // ヘルパー
    if (!activeNote) return;

    // マージ判定
    const targetNote = findMergeTarget(activeNote, pos.x, pos.y);
    
    if (targetNote) {
      mergeNotes(String(active.id), targetNote.id);
    } else {
      isPending 
        ? moveToBoard(String(active.id), pos.x, pos.y)
        : updateNotePositionAndStatus(String(active.id), pos.x, pos.y);
    }
  }, [...deps]);

  return { activeId, handleDragStart, handleDragEnd };
}
```

### ③ その他の改善点
- **ファイル名とフック名の不一致**: ファイル名が `useDragOnBoard.ts` であるのに対し、公開されているフック名が `useBoardLogic` となっています。どちらかに統一すべきです。
- **テスタビリティの向上**: 幾何計算を純粋関数に追い出すことで、Vitest で座標変換のテストが容易になります。現状では DOM が必要なため、テストが困難です。
