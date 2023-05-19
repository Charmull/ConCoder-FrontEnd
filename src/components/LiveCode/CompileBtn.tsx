import { MouseEventHandler } from "react";
import tw from "tailwind-styled-components";

interface PropType {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const CompileFloatBtn = ({ onClick }: PropType) => {
  return (
    <button id="hi" className="accent" onClick={onClick}>
      COMPILE
    </button>
  );
};

export default CompileFloatBtn;
