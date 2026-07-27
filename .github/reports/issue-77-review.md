# PRレビュー: #77 (pr-review-77)

実行日時: 2026-07-27T09:22:31+09:00

## 総評（短く）
- 目的（Issue #76 の「合成キャンセル時の誤動作修正」と「保留ボックス開閉時のレイアウト改善」）に沿った変更が行われていますが、重要な同期不整合により「合成キャンセル抑制」が正しく動作しない実装上の不具合が残っています。
- 優先度高: useDragOnBoard のローカル state と StickyNote 側で別インスタンスのフックを使っているため、キャンセルフラグが共有されず抑制が動作しません（再現性高）。
- 優先度中〜高: 保留ボックスの開閉状態がコンポーネントローカル（PendingDrawer）とグローバル（useStore）で二元管理されており、UI とレイアウト同期が取れない可能性があります。

## 良い点
- ユーザー向けのドキュメント（docs/architecture/*）と実装タスク（tasks/issue_76/*）が追加され、変更意図が明確になっています。レビュー時の理解がしやすいです。 (Confidence: High)
- 保留ボックス開閉状態をグローバル store に追加しているのは、他コンポーネントと連携する観点で良い設計意図です（ただし現在の実装は同期方法に問題あり）。 (Confidence: High)

---

## ファイル別コメント（重要なものを優先）

### 1) src/hooks/useDragOnBoard.ts
- 位置: 11-16, 52-56, 78 (参照行)
- 指摘内容: isCancelled をこのフック内のローカル state（useState）で管理しているため、このフラグはフックの "インスタンスごと" に分離されます。`useBoardDnd`（ドラッグの主要ロジックを持つインスタンス）と各 StickyNote コンポーネントで個別に useDragOnBoard が呼ばれており、キャンセルフラグが共有されず、StickyNote 側でのクリック抑制が機能しません。
- 重要度: 高
- 影響: 合成キャンセル後に付箋の詳細モーダルが開く誤動作が解消されない。ユーザー体験の重大な欠陥。 (Confidence: High)
- 修正案:
  - フラグをローカル state に保持するのではなく、グローバルな store（useStore）に移して共有する。具体的には useStore に `isMergeCancelled: boolean` と `setMergeCancelled: (v: boolean) => void` を追加し、ここで set を行う。フック内では `useStore.getState().setMergeCancelled(false)` / `...true` を呼ぶ。
  - さらに、active.rect の参照はネストが深いため安全に参照する（optional chaining）しておくと実行時例外を防げます。

- 推奨パッチ（抜粋）:
```ts
// (削除) const [isCancelled, setIsCancelled] = useState(false);
// 代わりに useStore の setter を使う
const setMergeCancelled = useStore.getState().setMergeCancelled;

// handleDragStart の先頭で
setMergeCancelled(false);

// キャンセル分岐で
setMergeCancelled(true);

// rect の安全な取得
const rect = active.rect?.current?.translated;
if (!rect) return;
```
(Confidence: High)

---

### 2) src/components/sticky-note/StickyNote.tsx
- 位置: 3, 10, 32-36
- 指摘内容: StickyNote 内で `const { isCancelled } = useDragOnBoard();` としているため、useDragOnBoard の別インスタンスから isCancelled を参照しており、上記の共有問題で期待動作を満たしません。また、キャンセル抑制が発生した後にフラグをクリアしていないと、次回以降の操作に影響を及ぼす可能性があります。
- 重要度: 高
- 影響: 合成キャンセルによるクリック抑制が効かない（Modal が開いてしまう）。 (Confidence: High)
- 修正案:
  - `useDragOnBoard` を直接参照するのではなく、共有ストア (`useStore`) の値を参照する。
  - 抑制した際はフラグを消す（`useStore.getState().setMergeCancelled(false)`）ことで副作用が残らないようにする。

- 推奨パッチ（抜粋）:
```ts
// 変更前
// const { isCancelled } = useDragOnBoard();

// 変更後
const isMergeCancelled = useStore(state => state.isMergeCancelled);

const handlePointerUp = () => {
  if (isMergeCancelled) {
    // 抑制したらフラグをクリア
    useStore.getState().setMergeCancelled(false);
    return;
  }
  if (!transform || (Math.abs(transform.x) < 5 && Math.abs(transform.y) < 5)) {
    selectNote(id);
  }
};
```
(Confidence: High)

---

### 3) src/components/pending/PendingDrawer.tsx
- 位置: 8-17, 32-41, 43-50
- 指摘内容: `isOpen` をコンポーネント内の useState として持ちつつ、同時に useStore に `openPendingBox` / `closePendingBox` を呼び出しているため、状態が二重管理されています。BoardContent は store の isPendingBoxOpen を参照してマージンを変えているため、Drawer の UI が store 状態と同期しないケース（他コンポーネントから開閉した場合や、初期値の不一致）が発生します。
- 重要度: 高
- 影響: UI とレイアウトの不整合（例: Drawer が開いているのに BoardContent のマージンが更新されない、またはその逆）。 (Confidence: High)
- 修正案:
  - コンポーネントローカルの isOpen を削除し、store の isPendingBoxOpen を単一のソースオブトゥルースにする。
  - toggle は store の openPendingBox / closePendingBox を呼ぶようにする。
  - またハンドルボタンに aria-label を付け、スクリーンリーダ向けのアクセシビリティを改善する。

- 推奨パッチ（抜粋）:
```tsx
// const [isOpen, setIsOpen] = useState(false);
const isOpen = useStore(state => state.isPendingBoxOpen);
const openPendingBox = useStore(state => state.openPendingBox);
const closePendingBox = useStore(state => state.closePendingBox);

const toggleDrawer = () => {
  if (isOpen) closePendingBox(); else openPendingBox();
};

// ボタンに aria-label を追加
<button aria-label="保留ボックスを開閉" onClick={toggleDrawer} ...>
```
(Confidence: High)

---

### 4) src/components/board/BoardContent.tsx
- 位置: 14-16
- 指摘内容: 保留ボックス開閉時に `mr-[320px]` を直接適用していますが、これが小さい画面（タブレット/モバイル）で右の象限を隠す原因になり得ます。Issue のタスクでも指摘されている通り、幅に応じたレスポンシブな調整が必要です。
- 重要度: 中
- 影響: 小〜中（閲覧環境によっては右側が隠れて操作できなくなる） (Confidence: Medium)
- 修正案:
  - マージンをすべての画面サイズで付与するのではなく、あるブレークポイント以上でのみ適用する（例: md:mr-[320px]）。または CSS グリッドの比率を動的に変える実装にする。

- 推奨パッチ（抜粋）:
```tsx
<div className={`relative h-full overflow-hidden bg-gray-50 transition-all duration-300 ${isPendingBoxOpen ? 'md:mr-[320px] mr-0' : 'mr-0'}`}>
```
(Confidence: Medium)

---

### 5) src/store/useStore.ts
- 位置: 32-40, 463-470
- 指摘内容: `isPendingBoxOpen` / `openPendingBox` / `closePendingBox` を追加した点は良いですが、今回の「合成キャンセル抑制」も共有フラグとして store に置くべきです（上記修正案に必要）。
- 重要度: 中〜高（変更の正しさに依存）
- 影響: store にフラグを入れることで、複数コンポーネント間での挙動同期が可能になります。
- 修正案（useStore に追加する型と初期値の例）:
```ts
// BoardState インターフェースに
isMergeCancelled: boolean;
setMergeCancelled: (v: boolean) => void;

// create(...) の初期値に
isMergeCancelled: false,
setMergeCancelled: (v) => set({ isMergeCancelled: v }),
```
(Confidence: High)

---

### 6) package.json
- 位置: 1-56
- 指摘内容: バージョン番号のインクリメントのみ（3.7.1 -> 3.7.2）。依存関係の変更は見られません。特に問題なし。 (Confidence: High)

---

## テスト / カバレッジに関する指摘
- merge キャンセルの振る舞い（ドラッグ→ドロップ→confirmキャンセル時にモーダルが開かないこと）を補う統合テスト（Vitest + @testing-library/react / dnd-kit のモック）を追加してください。重要な回帰防止になります。 (重要度: 高)
- 保留ボックス開閉時に BoardContent のレイアウトが正しく変わることを E2E かユニットで確認するテストを追加してください（レスポンシブの閾値も含める）。 (重要度: 中)

---

## アクセシビリティ (a11y) の軽微な指摘
- PendingDrawer の開閉ボタンに aria-label を追加してください（例: aria-label="保留ボックスを開閉"）。 (重要度: 低〜中)

---

## 最終チェックリスト（マージ前に確認・修正すべき項目）
1. [ - ] useStore に isMergeCancelled / setMergeCancelled を追加する（または別の共有スコープ） — (優先度: 高)
2. [ - ] useDragOnBoard 内の isCancelled 管理を store ベースに置き換え、active.rect の取得を optional chaining にして実行時例外を避ける — (優先度: 高)
3. [ - ] StickyNote を useDragOnBoard から isCancelled を取得する方式から、useStore 経由で isMergeCancelled を参照し、抑制後はフラグをクリアする実装にする — (優先度: 高)
4. [ - ] PendingDrawer のローカル isOpen を廃止して store.isPendingBoxOpen を単一ソースにする。トグルは store の open/close を呼ぶ実装に置き換える — (優先度: 高)
5. [ - ] BoardContent のマージン調整をレスポンシブ化（例: md:mr-[320px]）またはグリッド比率の動的変更にする — (優先度: 中)
6. [ - ] PendingDrawer の開閉ボタンに aria-label を付与する — (優先度: 低)
7. [ - ] Vitest / integration テストを追加：
   - 合成キャンセル時に modal が開かないこと (重要)
   - 保留ボックス開閉時のレイアウト変化 (中)

---

必要であれば、該当箇所の差分パッチ案（私が apply できる形）を用意します。まずは上記の設計変更（フラグを store に移動、PendingDrawer の単一化）を実装していただければ、再レビューします。

(このレビューは .github/reports/issue-77-review.md に保存しました)
