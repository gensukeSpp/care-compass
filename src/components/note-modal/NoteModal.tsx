import { useNoteModalState } from "../../hooks/useNoteState"
import { categoryLabels } from "./categoryLabels";
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