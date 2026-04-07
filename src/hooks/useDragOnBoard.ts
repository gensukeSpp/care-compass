import { useState, useCallback } from "react";
import { type DragEndEvent, type DragStartEvent, type UniqueIdentifier } from "@dnd-kit/core";
import { useStore } from "../store/useStore";
import { pixelsToPercentage, getQuadrantFromPosition } from '../utils/positionUtils';

export const useBoardLogic = () => {
  const { notes, pendingNotes, updateNotePositionAndStatus, moveToBoard, mergeNotes, containerDimensions } = useStore();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (containerDimensions.width === 0 || containerDimensions.height === 0) return;

    // データからタイプを判別
    const activeData = active.data.current;
    if (!activeData) return;

    const isPending = activeData.type === 'pending-note';
    const activeNote = isPending ? activeData.note : notes.find(n => n.id === active.id);
    
    if (!activeNote) return;

    // ドロップ位置（絶対座標）を取得
    const rect = active.rect.current.translated;
    if (!rect) return;

    // ボード上の%座標に変換
    // 注意: BoardがViewport全体(0,0)から始まっている前提
    const xPct = pixelsToPercentage(rect.left, containerDimensions.width);
    const yPct = pixelsToPercentage(rect.top, containerDimensions.height);
    const targetQuadrant = getQuadrantFromPosition(xPct, yPct);

    // 1. 直接他のノートの上にドロップしたかチェック (dnd-kitの over を利用)
    // 2. もしくは、ドロップ先の象限に同じカテゴリーのノートがあるかチェック (自動マージ要件)
    const overId = over?.id;
    let targetNote = notes.find(n => n.id === overId);
    
    // もし直接ノートの上でない場合、その象限にある同じカテゴリーのノートを探す
    if (!targetNote || targetNote.category !== activeNote.category) {
      targetNote = notes.find(n => 
        n.id !== active.id && 
        n.status === targetQuadrant && 
        n.category === activeNote.category
      );
    }
    
    // カテゴリーが一致し、自分自身でない場合にのみマージ
    if (targetNote && targetNote.id !== active.id && targetNote.category === activeNote.category) {
      mergeNotes(String(active.id), targetNote.id);
      console.log(`Merged ${activeNote.title} into ${targetNote.title} (Category: ${activeNote.category})`);
    } else {
      // 一致するノートがなければ、通常通り移動または追加
      if (isPending) {
        moveToBoard(String(active.id), xPct, yPct);
      } else {
        updateNotePositionAndStatus(String(active.id), xPct, yPct);
      }
    }
  }, [containerDimensions, notes, pendingNotes, mergeNotes, moveToBoard, updateNotePositionAndStatus]);

  return { notes, pendingNotes, activeId, handleDragStart, handleDragEnd };
}
