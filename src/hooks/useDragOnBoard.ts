import { type DragEndEvent } from "@dnd-kit/core";
import { useStore } from "../store/useStore";
import { pixelsToPercentage } from '../utils/positionUtils';

export const useBoardLogic = () => {
  const { notes, pendingNotes, updateNotePositionAndStatus, moveToBoard, containerDimensions } = useStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    // データからタイプを判別
    const activeData = active.data.current;
    const isPending = activeData?.type === 'pending-note';

    if (containerDimensions.width > 0 && containerDimensions.height > 0) {
      if (isPending) {
        // PendingDrawer から Board への移動
        // delta.x, delta.y はドラッグ開始地点（ドロワー内）からの相対距離
        // 本来はマウスの絶対座標から Board 内の相対座標を出すべきだが、
        // 簡易的に delta を使って「ドロップされた場所」を推定する
        // または、PointerSensor の座標を使用する。
        
        // 暫定：Drawerは右側にあるので、delta.x は負の値になるはず。
        // Board の左上を (0,0) とした場合の座標計算が必要。
        // ここでは一旦、画面中央付近に配置するか、
        // delta を使って計算（ただし基準が不明確）
        
        // より正確には: active.rect.current.translated を使う
        const rect = active.rect.current.translated;
        if (rect) {
          const xPct = pixelsToPercentage(rect.left, containerDimensions.width);
          const yPct = pixelsToPercentage(rect.top, containerDimensions.height);
          moveToBoard(String(active.id), xPct, yPct);
        }
      } else {
        // Board 内での移動
        const note = notes.find((n) => n.id === active.id);
        if (note) {
          const dxPct = pixelsToPercentage(delta.x, containerDimensions.width);
          const dyPct = pixelsToPercentage(delta.y, containerDimensions.height);
          const newX = note.x + dxPct;
          const newY = note.y + dyPct;
          updateNotePositionAndStatus(String(active.id), newX, newY);
        }
      }
    }
  }
  return { notes, handleDragEnd };
}
