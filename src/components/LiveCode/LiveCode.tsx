import React, { useEffect, useRef, useState } from "react";
import tw from "tailwind-styled-components";
import MonacoEditor from "@monaco-editor/react";
import CompileFloatBtn from "@/components/LiveCode/CompileBtn";
import SnapshotFloatBtn from "@/components/LiveCode/SnapshotBtn";
import useMonacoEditor from "@/hooks/Components/useMonacoEditor";
import useCodeSnapshot from "@/hooks/Components/useCodeSnapshot";
import SelectBox from "../_styled/Select";
import useCompile from "@/hooks/Components/useCompile";
import { useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import Tooltip from "@/components/_styled/Tooltip";
import CodeEditor from "./CodeEditor";
// codemiror 변경 시 필요한 import
import { ViewUpdate, lineNumbers } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import yorkie, { TextChange, type Text as YorkieText } from "yorkie-js-sdk";
import { Transaction, type ChangeSpec } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@/assets/styles/one-dark";

type YorkieDoc = {
  content: YorkieText;
};

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

  // ---@ codemirror yorkie 추가 @---
  // 렌더링 횟수 제한
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const client = new yorkie.Client(import.meta.env.VITE_YORKIE_API_ADDR, {
    apiKey: import.meta.env.VITE_YORKIE_API_KEY,
  });

  //   const doc = new yorkie.Document<YorkieDoc>(
  //     `${new Date().toISOString().substring(0, 10).replace(/-/g, "")}-codemirror6-${
  //       userInfo.workspaceId
  //     }`
  //   );
  const doc = new yorkie.Document<YorkieDoc>(`codemirror6-`);

  let editorParentElem = document.getElementById("codeEditorBox");
  const main = async () => {
    await client.activate();
    await client.attach(doc);
    doc.update((root) => {
      if (!root.content) {
        root.content = new yorkie.Text();
      }
    });

    const updateListener = EditorView.updateListener.of((ViewUpdate) => {
      if (ViewUpdate.docChanged) {
        for (const tr of ViewUpdate.transactions) {
          const events = ["select", "input", "delete", "move", "undo", "redo"];
          if (!events.map((event) => tr.isUserEvent(event)).some(Boolean)) {
            continue;
          }
          if (tr.annotation(Transaction.remote)) {
            continue;
          }
          tr.changes.iterChanges((fromA, toA, _, __, inserted) => {
            doc.update((root) => {
              root.content.edit(fromA, toA, inserted.toJSON().join("\n"));
            }, `update content byA ${client.getID()}`);
          });
        }
      }
    });

    const view = editorParentElem
      ? new EditorView({
          doc: "",
          extensions: [lineNumbers(), oneDark, python(), updateListener],
          parent: editorParentElem,
        })
      : null;

    const syncText = () => {
      const text = doc.getRoot().content;
      view?.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: text.toString(),
        },
        annotations: [Transaction.remote.of(true)],
      });
    };
    doc.subscribe((event) => {
      if (event.type === "snapshot") {
        syncText();
      }
    });
    await client.sync();
    syncText();

    // 컴파일 버튼에 붙이기@@
    const getAllText = () => {
      const allTextObj = view?.state.doc.toJSON();
      const allTextStr = allTextObj ? allTextObj.join("\n") : "";
      //   console.log(allTextObj?.join("\n"));
      //   console.log(typeof allTextObj?.join("\n"));
      return () => onCompile({ code: allTextStr });
    };
    const hiTag = document.getElementById("hi");
    if (hiTag) {
      // console.log(hiTag);
      // console.log(getAllText());
      hiTag.onclick = getAllText();
    }

    const changeEventHandler = (changes: Array<TextChange>) => {
      const clientId = client.getID();
      const changeSpecs: Array<ChangeSpec> = changes
        .filter(
          (change) => change.type === "content" && change.actor !== clientId
        )
        .map((change) => ({
          from: Math.max(0, change.from),
          to: Math.max(0, change.to),
          insert: change.value!.content,
        }));

      view?.dispatch({ changes: changeSpecs });
    };

    const text = doc.getRoot().content;
    text.onChanges(changeEventHandler);
  };

  useEffect(() => {
    editorParentElem = document.getElementById("codeEditorBox");
  }, []);
  useEffect(() => {
    if (editorParentElem && !isRendering) {
      main();
      setIsRendering(true);
    }
  }, [editorParentElem, isRendering]);

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
          options={{"read-only": !userInfo.host && !isEditable}}
          ref={monacoRef}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        /> */}
        {/* <CodeEditor /> */}
        <div id="codeEditorBox"></div>
      </MainDiv>
      <FloatButtonDiv style={{ transform: "translate(-50%, 0)" }}>
        {/* <CompileFloatBtn
          onClick={() => onCompile({ code: monacoRef.current.getValue() })}
        /> */}
        <CompileFloatBtn />
        <SnapshotFloatBtn onClick={onSnapshot} />
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
