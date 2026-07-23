import { useState, useCallback, useRef } from "react";
import type { ClientRect, DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useStore } from "../store/useStore";
import { convertToBoardPercentages, getActiveNoteInfo } from '../utils/positionUtils';

export const useDragOnBoard = () => {
  const { notes, pendingNotes, updateNotePositionAndStatus, moveToBoard, mergeNotes, setActiveCategory } = useStore();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    const noteInfo = getActiveNoteInfo(event.active, notes);
    if (noteInfo) {
      setActiveCategory(noteInfo.activeNote.category);
    }
  }, [notes, setActiveCategory]);

  const calculatePosition = useCallback((rect: ClientRect) => {
    const boardElement = boardRef.current;
    if (!boardElement) return;
    const boardRect = boardElement.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) return;

    return convertToBoardPercentages(rect, boardRect);
  }, [boardRef]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveCategory(null);

    const rect = active.rect.current.translated;
    if (!rect) return;

    const pos = calculatePosition(rect);
    if (!pos) return;

    const noteInfo = getActiveNoteInfo(active, notes);
    if (!noteInfo) return;

    const { activeNote, isPending } = noteInfo;

    // Use `over` (from dnd-kit) to identify if dropped ON a note
    const targetNote = over ? notes.find(n => n.id === over.id) : null;

    // マージ判定: カテゴリーが一致し、ドロップ先がノートである場合
    if (targetNote && targetNote.id !== active.id && targetNote.category === activeNote.category) {
      if (window.confirm('付箋内容を合成しますか(タイトルは移動先のものになります)？')) {
        mergeNotes(String(active.id), targetNote.id);
      } else {
        if (isPending) {
          moveToBoard(String(active.id), pos.x, pos.y);
        } else {
          updateNotePositionAndStatus(String(active.id), pos.x, pos.y);
        }
      }
    } else {
      // マージしない場合、通常通り移動
      if (isPending) {
        moveToBoard(String(active.id), pos.x, pos.y);
      } else {
        updateNotePositionAndStatus(String(active.id), pos.x, pos.y);
      }
    }
  }, [notes, calculatePosition, mergeNotes, moveToBoard, updateNotePositionAndStatus, setActiveCategory]);

  // 変更後 (After) - useDragOnBoard.ts に追加
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveCategory(null);
  }, [setActiveCategory]);

  return { notes, pendingNotes, activeId, handleDragStart, handleDragEnd, handleDragCancel, boardRef };
}
