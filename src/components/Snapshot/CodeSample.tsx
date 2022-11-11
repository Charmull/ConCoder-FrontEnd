import React from "react";
import MonacoEditor from "@monaco-editor/react";
import tw from "tailwind-styled-components";

interface PropType {
  code: string;
}

const CodeSample = ({ code }: PropType) => {
  return (
    <>
      {code ? (
        <>
          <MonacoEditor
            width="100%"
            height="90%"
            language="c"
            theme="vs-dark"
          />
          <button>복구</button>
        </>
      ) : (
        <PlaceholderDiv>
          왼쪽의 스냅샷을 선택해 <br></br>코드를 불러오세요!
        </PlaceholderDiv>
      )}
    </>
  );
};

export default CodeSample;

const PlaceholderDiv = tw.div`
w-full h-full
flex justify-center items-center
text-sm text-center
`;