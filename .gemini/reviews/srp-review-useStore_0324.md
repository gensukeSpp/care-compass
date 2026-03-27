# SRP Review: `src/store/useStore.ts`

単一責任の原則 (SRP) の観点から `src/store/useStore.ts` を分析した結果を報告します。

## 1. 責務の特定
このファイル（および `useStore`）は、現在以下の責務を担っています：

1.  **データ構造の定義**: `Note` インターフェースおよび `BoardState` インターフェースの定義。
2.  **初期データの提供**: アプリケーション起動時の初期ノートリストの保持。
3.  **状態管理ロジック**: ノートの追加、更新、削除、選択といったビジネスロジックの実行。
4.  **永続化の管理**: `zustand/middleware` を使用した LocalStorage への保存設定。
5.  **外部ID生成**: `uuidv4` を使用した新規ノートのID採番。

## 2. SRP 違反の特定
以下の点が SRP 違反の懸念として挙げられます：

*   **型定義と実装の混在**: `Note` インターフェースは他のコンポーネントでも利用される可能性が高い基幹的なデータ構造ですが、ストアの実装ファイル内に定義されています。
*   **初期データとストアの密結合**: デバッグ用または初期表示用のデータが `create` 関数の中に直接記述されており、初期データを変更するためだけにストアのロジックが含まれるファイルを編集する必要があります。
*   **ビジネスロジックの肥大化**: `addNote` や `updateNote` 内で `new Date().toISOString()` を生成したり `uuidv4()` を呼び出したりしており、純粋な状態遷移以外の責務（エンティティの生成規則）が混入しています。

## 3. 改善案の提示

### 3.1. 型定義の抽出
`Note` インターフェースを `src/types/index.ts` に移動し、ストアはそれをインポートするようにします。

### 3.2. 初期データの分離
初期データを定数として外部ファイル（例: `src/store/initialData.ts`）に切り出します。

### 3.3. 責務の分離（リファクタリング例）

```typescript
// src/types/index.ts に移動
export interface Note {
    id: string;
    title: string;
    category: Category;
    content: string;
    x: number;
    y: number;
    updatedAt?: string;
}

// src/store/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Category } from '../types/index';

// 初期データの分離
const INITIAL_NOTES: Note[] = [
    { id: '1', title: '散歩', category: 'health', content: '...', x: 50, y: 50 },
    // ...
];

interface BoardState {
    notes: Note[];
    // ... actions
}

export const useStore = create<BoardState>()(
    persist(
        (set) => ({
            notes: INITIAL_NOTES,
            // ...
            addNote: (title, content, category) =>
                set((state) => ({
                    notes: [
                        ...state.notes,
                        createNote(title, content, category) // 生成ロジックを関数化して分離を検討
                    ],
                })),
        }),
        { name: 'care-board-storage' }
    )
);

// エンティティ生成の責務を分離
function createNote(title: string, content: string, category: Category): Note {
    return {
        id: uuidv4(),
        title,
        content,
        category,
        x: 20,
        y: 20,
        updatedAt: new Date().toISOString(),
    };
}
```

このように分離することで、「データの形が変わる時」「初期データが変わる時」「保存先が変わる時」「ノート追加のルールが変わる時」というそれぞれの変更理由に対して、修正すべき箇所が明確になります。
