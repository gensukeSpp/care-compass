import { type GoogleTask } from "../services/tasksSyncService";
import type { Note } from "../types";

type StickyNote = Pick<Note, 'title' | 'content' | 'category' | 'googleTaskId'>;

export const mapGoogleTaskToPendingNote = (task: GoogleTask): StickyNote => ({
  title: task.title,
  content: task.notes || '',
  category: 'house',
  googleTaskId: task.googleTaskId
});
