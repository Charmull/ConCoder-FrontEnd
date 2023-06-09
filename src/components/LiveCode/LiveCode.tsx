import React, { useEffect, useRef, useState } from "react";
import tw from "tailwind-styled-components";
import MonacoEditor from "@monaco-editor/react";
import CompileFloatBtn from "@/components/LiveCode/CompileBtn";
import SnapshotFloatBtn from "@/components/LiveCode/SnapshotBtn";
import useMonacoEditor from "@/hooks/Components/useMonacoEditor";
import useCodeSnapshot from "@/hooks/Components/useCodeSnapshot";
import SelectBox from "../_styled/Select";
import useCompile from "@/hooks/Components/useCompile";
import { useRecoilState, useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import Tooltip from "@/components/_styled/Tooltip";
import { Tldraw, useFileSystem } from "@tldraw/tldraw";
import DrawingFloatBtn from "./DrawingBtn";
import CustomCursor from "../Drawing/CustomCursor";
import useMultimemberState from "@/hooks/Components/useMultimemberState";
import CodeEditor from "./CodeEditor";
import { liveCodeContentSetter } from "@/store/liveCode";

const LiveCode = () => {
  const { onCompile } = useCompile();
  const [isEditable, setIsEditable] = useState(false);
  const userInfo = useRecoilValue(userInfoState);
  // const {
  //   monaco,
  //   monacoRef,
  //   setliveCodeSetter,
  //   handleEditorDidMount,
  //   handleEditorChange,
  // } = useMonacoEditor();

  // 현재 코드에디터의 모든 텍스트
  const [currentText, setCurrentText] = useState("");

  // const { onSnapshot } = useCodeSnapshot(monacoRef);
  const { onSnapshot } = useCodeSnapshot(currentText);

  // Drawing Board의 Display/Hide 관련 state와 setter
  const [displayDrawingBoard, setDisplayDrawingBoard] =
    useState<boolean>(false);
  const onDrawing = () => {
    setDisplayDrawingBoard((prev: boolean) => !prev);
  };

  // Drawing 동시성 관련
  const fileSystemEvents = useFileSystem();
  const { ...events } = useMultimemberState(
    // `${new Date().toISOString().substring(0, 10).replace(/-/g, "")}-tldraw-${
    //   userInfo.workspaceId
    // }`,
    // 새로운 doc 생성을 막기 위해 임시로 수동 입력 (@TODO: 배포 전 수정 필요)
    `20230519-tldraw-e565393b-8a2d-47c1-a31a-2239131004a4`,
    userInfo.username
  );
  const component = { Cursor: CustomCursor };

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
        {/* <MonacoEditor
          width="100%"
          height="calc(100% - 60px)"
          language="python"
          theme="vs-dark"
          options={{ "read-only": !userInfo.host && !isEditable }}
          ref={monacoRef}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        /> */}

        {/* overflow-y 생기도록 하기 위해 wrapper 생성 */}
        {/* <div className="h-[calc(100%-100px)] overflow-y-auto"> */}
        <CodeEditor setCurrentText={setCurrentText} />
        {/* </div> */}

        {displayDrawingBoard ? (
          <DrawingBoardDiv>
            <Tldraw
              components={component}
              autofocus
              disableAssets={true}
              showPages={false}
              {...fileSystemEvents}
              {...events}
            />
          </DrawingBoardDiv>
        ) : null}
      </MainDiv>
      <FloatButtonDiv style={{ transform: "translate(-50%, 0)" }}>
        {/* <CompileFloatBtn
          onClick={() => onCompile({ code: monacoRef.current.getValue() })}
        /> */}
        <CompileFloatBtn onClick={() => onCompile({ code: currentText })} />
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

const DrawingBoardDiv = tw.div`
relative
top-[calc(-100%+60px)]
w-full h-[calc(100%-50px)]
`;

// top-[calc(-100%+20px)]
// w-full h-[calc(100%-50px)]
