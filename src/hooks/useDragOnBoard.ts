import { type DragEndEvent } from "@dnd-kit/core";

import { useStore } from "../store/useStore";
import { pixelsToPercentage, getQuadrantFromPosition } from '../utils/positionUtils';

export const useBoardLogic = () => {
  const { notes, updateNotePosition, containerDimensions, updateNoteStatus } = useStore();
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const note = notes.find((n) => n.id === active.id);
    if (note && containerDimensions.width > 0 && containerDimensions.height > 0) {
      // delta(px) を比率(%)に変換して足す
      const dxPct = pixelsToPercentage(delta.x, containerDimensions.width);
      const dyPct = pixelsToPercentage(delta.y, containerDimensions.height);
      const newX = note.x + dxPct;
      const newY = note.y + dyPct;

      updateNotePosition(String(active.id), newX, newY);

      const newStatus = getQuadrantFromPosition(newX, newY);
      if (note.status !== newStatus) {
        updateNoteStatus(String(active.id), newStatus);
      }
    }
  }
  return { notes, handleDragEnd };
}