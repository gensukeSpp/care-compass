import { useState, useCallback, useRef } from "react";
import type { ClientRect, DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useStore } from "../store/useStore";
import { pixelsToPercentage, getQuadrantFromPosition, convertToBoardPercentages, getActiveNoteInfo } from '../utils/positionUtils';
import type { Note } from "../types";

export const useDragOnBoard = () => {
  const { notes, pendingNotes, updateNotePositionAndStatus, moveToBoard, mergeNotes, containerDimensions } = useStore();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  // 1. 幾何計算の責務を分離
  const calculatePosition = useCallback((rect: ClientRect) => {
    const boardElement = boardRef.current;
    // const boardElement = document.querySelector<HTMLElement>('.four-quadrant-board');
    if (!boardElement) return;
    const boardRect = boardElement.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) return;

    return convertToBoardPercentages(rect, boardRect);
  }, [boardRef]);

  // 2. マージ判定の責務を分離 (Store 側に持たせるのが理想的)
  const findMergeTarget = useCallback((note: Note, x: number, y: number) => {
    const targetQuadrant = getQuadrantFromPosition(x, y);

    // もし直接ノートの上でない場合、その象限にある同じカテゴリーのノートを探す
    // if (!targetNote || targetNote.category !== activeNote.category) {
    return notes.find(n =>
      n.id !== note.id &&
      n.status === targetQuadrant &&
      n.category === note.category
    );
  }, [notes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (containerDimensions.width === 0 || containerDimensions.height === 0) return;

    // ドロップ位置（絶対座標）を取得（ノート自体の rect）
    const rect = active.rect.current.translated;
    if (!rect) return;

    const pos = calculatePosition(rect);
    if (!pos) return;

    // const { activeNote, isPending } = getActiveNoteInfo(active, notes); // ヘルパー
    const noteInfo = getActiveNoteInfo(active, notes); // ヘルパー
    if (!noteInfo) return;

    const { activeNote, isPending } = noteInfo;

    // 1. 直接他のノートの上にドロップしたかチェック (dnd-kitの over を利用)
    // 2. もしくは、ドロップ先の象限に同じカテゴリーのノートがあるかチェック (自動マージ要件)
    // const overId = over?.id;
    // let targetNote = notes.find(n => n.id === overId);
    // targetNote = findMergeTarget(activeNote, pos.x, pos.y);
    // ↓ は、移動先ノートか
    // マージ判定
    const targetNote = findMergeTarget(activeNote, pos.x, pos.y);

    // カテゴリーが一致し、自分自身でない場合にのみマージ
    if (targetNote && targetNote.id !== active.id && targetNote.category === activeNote.category) {
      if (window.confirm('付箋内容を合成しますか(タイトルは移動先のものになります)？')) {
        mergeNotes(String(active.id), targetNote.id);
        console.log(`Merged ${activeNote.title} into ${targetNote.title} (Category: ${activeNote.category})`);
      }
    } else {
      // 一致するノートがなければ、通常通り移動または追加
      if (isPending) {
        moveToBoard(String(active.id), pos.x, pos.y);
      } else {
        updateNotePositionAndStatus(String(active.id), pos.x, pos.y);
      }
    }
  }, [containerDimensions, notes, pendingNotes, mergeNotes, moveToBoard, updateNotePositionAndStatus]);

  return { notes, pendingNotes, activeId, handleDragStart, handleDragEnd, boardRef };
}
