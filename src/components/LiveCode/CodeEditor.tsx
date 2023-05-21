import { ViewUpdate, lineNumbers } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import yorkie, { TextChange, type Text as YorkieText } from "yorkie-js-sdk";
import { Transaction, type ChangeSpec } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import { oneDark } from "@/assets/styles/one-dark";
import useCompile from "@/hooks/Components/useCompile";
import { liveCodeContentSetter } from "@/store/liveCode";
import tw from "tailwind-styled-components";

type YorkieDoc = {
  content: YorkieText;
};

interface Props {
  setCurrentText: Function;
}
const CodeEditor = ({ setCurrentText }: Props) => {
  // 렌더링 횟수 제한
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const [, setliveCodeSetter] = useRecoilState(liveCodeContentSetter);

  const userInfo = useRecoilValue(userInfoState);

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

    // // 컴파일 버튼에 붙이기@@
    // const getAllText = () => {
    //   const allTextObj = view?.state.doc.toJSON();
    //   const allTextStr = allTextObj?.join("\n");
    //   //   console.log(allTextObj?.join("\n"));
    //   //   console.log(typeof allTextObj?.join("\n"));
    //   //   allTextStr && setCompileFun(() => onCompile({ code: allTextStr }));
    // };
    // // const hiTag = document.getElementById("hi");
    // // if (hiTag) {
    // //   hiTag.onclick = getAllText;
    // // }

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
      view && setCurrentText(view?.state.doc.toJSON().join("\n"));
    };

    const text = doc.getRoot().content;
    text.onChanges(changeEventHandler);

    setliveCodeSetter({
      func: async (code: string) => {
        view?.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: code,
          },
          //   annotations: [Transaction.remote.of(true)],
        });

        let arr = [];
        for (var i = 0; i < code.length; i++) {
          arr.push({ val: code.charAt(i) });
        }
        console.log(JSON.stringify({ content: arr }));

        // root로 바뀐 부분을 push해야하는데, 타입을 맞추기가 어려움...
        // doc.getRoot().content = JSON.stringify({ content: arr });
      },
    });
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
  //   useEffect(() => {
  //     editorParentElem && main();
  //   }, [editorParentElem]);

  return (
    <>
      {/* <button id="hi">hi</button> */}
      {/* <MainDiv> */}
      <MainWrapper>
        <div id="codeEditorBox"></div>
      </MainWrapper>
      {/* </MainDiv> */}
      {/* <MainDiv id="codeEditorBox"></MainDiv> */}
      {/* <div id="codeEditorBox"></div> */}
    </>
  );
};

export default CodeEditor;

const MainDiv = tw.div`
relative
h-full
`;

/* overflow-y 생기도록 하기 위해 wrapper 생성 */
const MainWrapper = tw.div`
h-[calc(100%-100px)] overflow-y-auto`;
