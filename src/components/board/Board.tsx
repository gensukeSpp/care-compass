import { forwardRef, type ComponentPropsWithRef, type JSX } from 'react';
import { BoardBackground } from './BoardBackground';
import { StickyNote } from '../sticky-note/StickyNote';
import { useDropOnBoard } from '../../hooks/useDropMdFile';
import { useStore } from '../../store/useStore';

export function Board() {
  const { handleDrop } = useDropOnBoard();
  const notes = useStore((state) => state.notes);

  return (
    <div
      onDragOver={(e) => e.preventDefault()} // ドロップを許可するために必要
      onDrop={handleDrop}
      className="four-quadrant-board h-screen w-screen relative overflow-hidden">
      <BoardBackground type="4-quadrant" /> {/* グリッドを抽象化 */}
      {notes.map(note => <StickyNote key={note.id} {...note} />)}
    </div>
  );
};

Board.displayName = 'Board';  // デバッグ時の表示用名前