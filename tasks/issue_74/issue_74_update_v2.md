
  修正実装プラン (issue_74_update_v2.md)

  1. タスク 02: Merge & Drag Logic の修正
   * Objective: マージ判定の厳格化（接触検知）と不要なモーダル抑制。
   * Tasks:
       * [ ] useDragOnBoard.ts: マージ判定を「ドラッグ中の接触検知（isOver）」に基づくよう更新。
       * [ ] StickyNote.tsx: 異なるカテゴリ接触時に編集モーダルが誤って開くことを防止するため、クリックハンドラと DnD
         終了時の処理を分離・制御。
       * [ ] useStore.ts: マージ処理をドラッグ中の接触判定（同一カテゴリのみ）に基づき厳格化。

  2. タスク 03: UI/UX Refinement の修正
   * Objective: 接触時の視覚フィードバックおよびタブレット以下のレスポンシブ対応。
   * Tasks:
       * [ ] StickyNoteView.tsx:
           * 同じカテゴリの付箋が接触したときのみ、ホバースタイル（isOver）を適用する。
           * 異なるカテゴリの付箋が接触してもスタイルは変化させない。
       * [ ] CSS (Tailwind): タブレット以下のサイズにおいて、StickyNoteView の縦幅のみを 1/3 にする（横幅は維持）。
       * [ ] DragOverlay: マージ可能な対象のみ視覚フィードバックを反映するように更新。

  ---
