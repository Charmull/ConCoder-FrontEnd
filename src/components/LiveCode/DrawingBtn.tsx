import { MouseEventHandler } from "react";

interface PropType {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

const DrawingFloatBtn = ({ onClick }: PropType) => {
  return (
    <button className="accent" onClick={onClick}>
      DRAWING
    </button>
  );
};

export default DrawingFloatBtn;
