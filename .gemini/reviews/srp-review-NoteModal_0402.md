# SRP Review: NoteModal.tsx

## 1. 責務の特定
`NoteModal` コンポーネントは、現在以下の複数の責務を担っています。

1.  **データ取得・選択**: ストアから `selectedNoteId` に基づいて対象のノート（通常または保留）を特定する。
2.  **UI状態管理**: 編集モード (`isEditing`)、追記モード (`isAppending`)、および入力フォームの状態管理。
3.  **ビジネスロジック - 更新/保存**: ノートの属性変更や、バリデーション（空チェックなど）を含む保存処理。
4.  **ビジネスロジック - 追記**: タイムスタンプの生成と Markdown 形式での文字列結合処理 (`handleAppendComment`)。
5.  **ビジネスロジック - ボード移動**: 保留ノートをボード上の特定の象限に移動し、初期座標を計算する処理 (`handleAddToBoard`)。
6.  **ビュー - レイアウト**: モーダル全体の配置、背景のオーバーレイ、スクロール制御などの構造定義。
7.  **ビュー - レンダリング**: Markdown のパース表示、カテゴリラベルの表示、変更履歴のリスト表示。

## 2. SRP 違反の特定
以下の箇所において、単一責任の原則 (SRP) に違反していると考えられます。

-   **ビジネスロジックの混在**: `handleAppendComment` や `handleAddToBoard` のような具体的なデータ加工ルールが UI コンポーネント内に直接記述されています。特に座標のハードコードは、レイアウト変更時にこのコンポーネントを修正しなければならない「変更の理由」となります。
-   **肥大化したレンダリングロジック**: 編集モードと表示モードの切り替えが `return` 文の中で大きな三項演算子や条件分岐として存在しており、視認性が低下しています。
-   **定数の保持**: `categoryLabels` のような翻訳/表示用ラベルがコンポーネント内にハードコードされており、多言語対応やカテゴリ追加時にこのコンポーネントを修正する必要があります。

## 3. 改善案の提示

### ① ロジックの抽出 (Custom Hook)
座標計算や追記ロジックをコンポーネントから分離します。

```typescript
// hooks/useNoteActions.ts (イメージ)
export const useNoteActions = (noteId: string) => {
  const { updateNote, moveToBoard } = useStore();

  const appendComment = (currentContent: string, comment: string) => {
    const timestamp = new Date().toLocaleString();
    const appendedContent = `${currentContent}\n\n---\n**${timestamp}**\n${comment}`;
    updateNote(noteId, { content: appendedContent });
  };

  const addNoteToBoard = (quadrant: QuadrantId) => {
    const { x, y } = calculateInitialPosition(quadrant); // positionUtils 等から取得
    moveToBoard(noteId, x, y);
  };

  return { appendComment, addNoteToBoard };
};
```

### ② コンポーネントの分割
役割ごとにコンポーネントを分割し、`NoteModal` はそれらを組み立てる「オーケストレーター」に徹します。

-   `NoteModalHeader`: タイトルと閉じるボタン。
-   `NoteViewMode`: Markdown 表示と履歴表示。
-   `NoteEditMode`: 入力フォーム。
-   `NoteAppendForm`: 追記専用のテキストエリアとボタン。
-   `NoteModalFooter`: アクションボタン（保存、削除、象限移動）のグループ。

### ③ 具体的なコード構造案

```tsx
export const NoteModal = () => {
  const { note, isEditing, setIsEditing, ... } = useNoteModalState(); // 状態管理の分離

  return (
    <ModalWrapper onClose={close}>
      <NoteModalHeader note={note} isEditing={isEditing} onTitleChange={...} />
      
      <div className="content">
        {isEditing ? (
          <NoteEditForm note={note} onFieldsChange={...} />
        ) : (
          <>
            <NoteContentView content={note.content} />
            <NoteAppendForm onAppend={handleAppend} />
            <NoteHistoryList history={note.history} />
          </>
        )}
      </div>

      <NoteModalFooter 
        isEditing={isEditing}
        isPending={note.status === 'pending'}
        onSave={handleSave}
        onDelete={handleDelete}
        onMoveToBoard={handleMoveToBoard}
      />
    </ModalWrapper>
  );
};
```

このように分割することで、追記UIのデザイン変更は `NoteAppendForm`、ボード配置の計算ルール変更は `useNoteActions`、全体レイアウトの変更は `NoteModal` と、変更の理由を限定させることができます。
