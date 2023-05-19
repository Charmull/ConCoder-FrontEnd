import { ViewUpdate, lineNumbers } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import yorkie, { TextChange, type Text as YorkieText } from "yorkie-js-sdk";
import { Transaction, type ChangeSpec } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";

type YorkieDoc = {
  content: YorkieText;
};

const CodeEditor = () => {
  // 렌더링 횟수 제한
  const [isRendering, setIsRendering] = useState<boolean>(false);

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
          extensions: [lineNumbers(), python(), updateListener],
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
      const allText = view?.state.doc.toJSON();
      console.log(allText?.join("\n"));
    };

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
  //   useEffect(() => {
  //     editorParentElem && main();
  //   }, [editorParentElem]);

  return <div id="codeEditorBox"></div>;
};

export default CodeEditor;
