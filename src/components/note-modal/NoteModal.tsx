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
  const { note, isEditing, setIsEditing, isPending, selectNote, editTitle, setEditTitle, editContent, setEditContent, editCategory, setEditCategory } = useNoteModalState();

  if (!note) return null;

  const categoryLabels: Record<Category, string> = {
    house: '🏠 居住・環境',
    food: '🍱 食生活',
    health: '💪 身体・体力',
    medical: '💊 医療・健康',
    social: '🧑‍🤝‍🧑 社会・交流',
  };
  console.log(isEditing);
  // console.log(isPending);

  return (
    <NoteModalWrapper>
      <NoteHeader
        isEditing={isEditing}
        isPending={isPending}
        categoryLabel={categoryLabels[note.category]}
        noteTitle={note.title}
        editTitle={editTitle}
        authorName={note.authorName}
        setEditTitle={setEditTitle}
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
              note={note}
              categoryLabel={categoryLabels[note.category]}
            />
            <NoteAppendWithTimestamp
              note={note}
              editContent={note.content || ''}
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
        isPending={isPending}
        editTitle={editTitle}
        editContent={editContent}
        editCategory={editCategory}
      />
    </NoteModalWrapper>
  );
}