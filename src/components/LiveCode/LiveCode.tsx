import React, { useState } from "react";
import tw from "tailwind-styled-components";
import MonacoEditor from "@monaco-editor/react";
import CompileFloatBtn from "@/components/LiveCode/CompileBtn";
import SnapshotFloatBtn from "@/components/LiveCode/SnapshotBtn";
import useMonacoEditor from "@/hooks/Components/useMonacoEditor";
import useCodeSnapshot from "@/hooks/Components/useCodeSnapshot";
import SelectBox from "../_styled/Select";
import useCompile from "@/hooks/Components/useCompile";
import { EditorView } from "codemirror";
import { useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import Tooltip from "@/components/_styled/Tooltip";
import { Tldraw } from "@tldraw/tldraw";
import DrawingFloatBtn from "./DrawingBtn";

const LiveCode = () => {
  const { onCompile } = useCompile();
  const [isEditable, setIsEditable] = useState(false);
  const userInfo = useRecoilValue(userInfoState);
  const {
    monaco,
    monacoRef,
    setliveCodeSetter,
    handleEditorDidMount,
    handleEditorChange,
  } = useMonacoEditor();
  const { onSnapshot } = useCodeSnapshot(monacoRef);

  // Drawing Board의 Display/Hide 관련 state와 setter
  const [displayDrawingBoard, setDisplayDrawingBoard] =
    useState<boolean>(false);
  const onDrawing = () => {
    setDisplayDrawingBoard((prev: boolean) => !prev);
  };

  return (
    <>
      <MainDiv>
        <FlexDiv>
          <Tooltip tip="다른 언어는 준비중입니다.">
            <SelectBox
              setSelection={() => {}}
              disabled={true}
              placeholder="python"
              className="select select-xs mb-[4px] h-[30px] w-fit"
            />
          </Tooltip>
          <Tooltip tip="호스트만 사용할 수 있는 기능입니다.">
            <input
              type="checkbox"
              className="toggle"
              disabled={!userInfo.host}
              checked={isEditable}
              onClick={() => {
                setIsEditable(!isEditable);
              }}
            />
          </Tooltip>
        </FlexDiv>
        <MonacoEditor
          width="100%"
          height="calc(100% - 60px)"
          language="python"
          theme="vs-dark"
          options={{ "read-only": !userInfo.host && !isEditable }}
          ref={monacoRef}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
        {displayDrawingBoard ? (
          <div
            style={{
              position: "relative",
              top: "calc(-100% + 20px)",
              width: "100%",
              height: "calc(100% - 50px)",
            }}
          >
            <Tldraw />
          </div>
        ) : null}
      </MainDiv>
      <FloatButtonDiv style={{ transform: "translate(-50%, 0)" }}>
        <CompileFloatBtn
          onClick={() => onCompile({ code: monacoRef.current.getValue() })}
        />
        <SnapshotFloatBtn onClick={onSnapshot} />
        <DrawingFloatBtn onClick={onDrawing} />
      </FloatButtonDiv>
    </>
  );
};

export default LiveCode;

const MainDiv = tw.div`
w-full h-full
`;

const FloatButtonDiv = tw.div`
relative
bottom-[60px] left-[50%]
w-fit h-[60px]
px-[10px]
rounded-[15px]
dark-1
flex gap-[10px]
justify-around
z-100
`;

const FlexDiv = tw.div`
w-full h-fit
flex items-center justify-between
pr-[10px]
`;
