import { type DragEndEvent } from "@dnd-kit/core";

import { useStore } from "../store/useStore";
import { pixelsToPercentage } from '../utils/positionUtils';

export const useBoardLogic = () => {
  const { notes, updateNotePositionAndStatus, containerDimensions } = useStore();
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const note = notes.find((n) => n.id === active.id);
    if (note && containerDimensions.width > 0 && containerDimensions.height > 0) {
      // delta(px) を比率(%)に変換して足す
      const dxPct = pixelsToPercentage(delta.x, containerDimensions.width);
      const dyPct = pixelsToPercentage(delta.y, containerDimensions.height);
      const newX = note.x + dxPct;
      const newY = note.y + dyPct;

      updateNotePositionAndStatus(String(active.id), newX, newY);
    }
  }
  return { notes, handleDragEnd };
}
