import { useNoteModalState } from "../../hooks/useNoteState"
import { type Category } from "../../types";
import { NoteEditForm } from "./NoteModalEditForm";
import { NoteHeader } from "./NoteModalHeader";
import { NoteModalWrapper } from "./NoteModalWrapper";
import { NoteContentView } from "./NoteModalContent";
import { NoteAppendWithTimestamp } from "./NoteModalAppendForm";
import { NoteQuadHistory } from "./NoteModalHistory";
import { NoteFooter } from "./NoteModalFooter";

export function NoteModalTop() {
  const { note, isEditing, setIsEditing, editTitle, setEditTitle, editContent, setEditContent, editCategory, setEditCategory, newComment, setNewComment, isAppending, setIsAppending, isPending, selectNote } = useNoteModalState();

  if (!note) return null;

  const categoryLabels: Record<Category, string> = {
    house: '🏠 居住・環境',
    food: '🍱 食生活',
    health: '💪 身体・体力',
    medical: '💊 医療・健康',
    social: '🧑‍🤝‍🧑 社会・交流',
  };

  return (
    <NoteModalWrapper>
      <NoteHeader
        isEditing={isEditing}
        editTitle={editTitle}
        onTitleChange={setEditTitle}
        categoryLabel={note.category}
        noteTitle={note.title}
        isPending={isPending}
        selectNote={selectNote}
      />
      <div className="content">
        {isEditing ? (
          <NoteEditForm
            categoryLabels={categoryLabels}
            editContent={editContent}
            setEditContent={setEditContent}
            editCategory={editCategory}
            setEditCategory={setEditCategory}
          />) : (
          <>
            <NoteContentView
              categoryLabels={categoryLabels}
              note={note}
            />
            <NoteAppendWithTimestamp
              note={note}
              isAppending={isAppending}
              setIsAppending={setIsAppending}
              newComment={newComment}
              setNewComment={setNewComment}
              editContent={editContent}
            />
            <NoteQuadHistory
              note={note}
              isEditing={isEditing}
            />
          </>
        )}
      </div>
      <NoteFooter
        note={note}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editTitle={editTitle}
        editContent={editContent}
        editCategory={editCategory}
        isPending={isPending}
      />
    </NoteModalWrapper>
  );
}