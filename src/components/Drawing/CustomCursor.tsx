import { CursorComponent } from "@tldraw/core";
import tw from "tailwind-styled-components";

// 다른 멤버의 커서를 커스텀
const CustomCursor: CursorComponent<{ name: string }> = ({
  color,
  metadata,
}) => {
  return (
    <CursorMainDiv>
      <CursorPonter style={{ background: color }} />
      <CursorName>{metadata!.name}</CursorName>
    </CursorMainDiv>
  );
};

export default CustomCursor;

const CursorMainDiv = tw.div`
flex
w-fit
items-center
gap-[8px]
`;

const CursorPonter = tw.div`
w-[12px] h-[12px]
rounded-full
`;

const CursorName = tw.div`
bg-white
py-[4px] px-[8px]
rounded-[4px]
whitespace-nowrap
text-[#292929]
`;
