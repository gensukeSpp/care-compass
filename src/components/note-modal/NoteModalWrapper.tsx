import { type Note } from "../../types/index";

interface ModalWrapperProps {
  // onClose: () => void;
  children: React.ReactNode;
}

export const NoteModalWrapper = ({ children }: ModalWrapperProps) => {

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}