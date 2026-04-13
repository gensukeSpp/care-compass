import { forwardRef } from "react";
import { Board } from "./Board";

export const BoardReference = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className="absolute top-0 left-0 w-full h-full">
      <Board />
    </div>
  );
});