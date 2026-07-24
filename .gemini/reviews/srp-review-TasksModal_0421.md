# SRP Review: TasksModal.tsx

- **作成日**: 2026-04-21
- **対象ファイル**: `src/components/pending/TasksModal.tsx`
- **レビュアー**: Gemini CLI (Clean Code & OOD Expert)

## 1. 責務の特定
`TasksModal` コンポーネントは、以下の独立した「変更する理由」を複数抱えています。

1. **UI レンダリングとレイアウト**: モーダルの構造、アニメーション、ローディング/エラー状態の表示。
2. **ステップ制御（Navigation）**: 「リスト選択」と「タスク選択」の間の状態遷移管理。
3. **データ取得（Data Fetching）**: `tasksSyncService` を利用した外部 API との通信オーケストレーション。
4. **選択・フィルタリングのビジネスロジック**: 
    - 既存の付箋との ID 照合による「インポート済み」の判定。
    - 個別選択および「未インポート分のみ全選択」のロジック。
5. **データ変換（Data Mapping）**: `GoogleTask` 型から `PendingNote`（ストアの内部型）へのマッピング。

## 2. SRP 違反の特定

- **UI とドメインロジックの密結合**: 
  `existingGoogleTaskIds` の計算や、インポート時のオブジェクト変換ロジックが JSX のすぐそばに記述されており、UI の変更とロジックの変更が同じファイルに影響します。
- **肥大化したコンポーネント（Fat Component）**: 
  1 つのコンポーネントが 2 つのステップ（Lists/Tasks）と、それぞれのローディング・エラー状態をすべて管理しているため、コード量が多く見通しが悪くなっています。
- **サービスへの直接依存**:
  `tasksSyncService` を直接 import して呼び出しているため、API 仕様の変更が UI コンポーネントに直接波及します。

## 3. 改善案の提示

### ① カスタムフック `useTasksImport` へのロジック抽出
状態管理とビジネスロジックを UI から切り離します。これには、API 通信、選択状態の管理、インポート済み判定が含まれます。

```typescript
// src/hooks/useTasksImport.ts (抽出例)
export const useTasksImport = (onClose: () => void) => {
  const [step, setStep] = useState<'lists' | 'tasks'>('lists');
  const [isLoading, setIsLoading] = useState(true);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  const { notes, pendingNotes, addPendingNotes } = useStore();

  const isImported = (id: string) => {
    // インポート済み判定ロジック
  };

  const handleImport = () => {
    // PendingNoteへの変換とaddPendingNotesの実行
  };

  return { step, setStep, isLoading, taskLists, tasks, selectedTaskIds, isImported, handleImport, ... };
};
```

### ② サブコンポーネントの分割
各ステップの表示内容を `TaskListStep.tsx` や `TaskSelectStep.tsx` として分割し、`TasksModal` 自体はそれらを配置する「オーケストレーター」に専念させます。

### ③ マッパー関数の定義
`GoogleTask` から `PendingNote` への変換は、独立したユーティリティ関数として定義することで、テストを容易にし、再利用性を高めます。

```typescript
const mapGoogleTaskToPendingNote = (task: GoogleTask): Partial<StickyNote> => ({
  title: task.title,
  content: task.notes || '',
  category: 'house',
  googleTaskId: task.googleTaskId
});
```

---
## 結論
`TasksModal.tsx` は現状「多機能すぎる」状態です。ロジックをフックに逃がし、表示をサブコンポーネントに分割することで、保守性とテスト容易性が大幅に向上します。
